class Router {
  constructor() {
    this.init();
  }

  init() {
    // 绑定所有导航链接（包括动态生成的）
    document.addEventListener('click', e => {
      const link = e.target.closest('a.nav-item');
      if (link && this.isInternalLink(link.href)) {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });

    window.addEventListener('popstate', () => this.loadPage(location.pathname));
    this.loadPage(location.pathname);
  }

  isInternalLink(url) {
    return url.startsWith(window.location.origin) || url.startsWith('/') || url.startsWith('./');
  }

  async navigate(path) {
    // 添加退出动画
    document.body.classList.add('page-exit');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 更新历史记录
    history.pushState(null, null, path);
    
    try {
      await this.loadPage(path);
    } catch (error) {
      console.error('Navigation failed:', error);
      window.location = path; // 降级方案
    }
    
    document.body.classList.remove('page-exit');
  }

  async loadPage(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const html = await response.text();
      this.updateDOM(html);
      this.initPageFeatures();
      this.scrollToTop();
    } catch (error) {
      console.error('Page load failed:', error);
      throw error;
    }
  }

  updateDOM(html) {
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(html, 'text/html');
    
    // 渐进式DOM更新
    const updateElements = ['header', '.main-container'];
    updateElements.forEach(selector => {
      const newElement = newDoc.querySelector(selector);
      const oldElement = document.querySelector(selector);
      if (newElement && oldElement) {
        oldElement.parentNode.replaceChild(
          oldElement.cloneNode(false), 
          oldElement
        ).outerHTML = newElement.outerHTML;
      }
    });
    
    document.title = newDoc.title;
  }

  // 其他方法保持不变...
}

  initPageFeatures() {
    // 初始化页面特有功能
    if (document.getElementById('blog-form')) {
      this.initBlogForm();
    }
    if (document.querySelector('.article-list')) {
      this.loadBlogList();
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 初始化路由
new Router();

// 博客管理模块
const BlogManager = (() => {
  if (!localStorage.getItem('blogCounter')) {
    localStorage.setItem('blogCounter', '0');
    localStorage.setItem('blogs', JSON.stringify([]));
  }

  const getNextId = () => {
    let counter = parseInt(localStorage.getItem('blogCounter')) + 1;
    localStorage.setItem('blogCounter', counter.toString());
    return counter.toString().padStart(4, '0');
  };

  const saveBlog = (title, content) => {
    const blogs = JSON.parse(localStorage.getItem('blogs'));
    const newBlog = {
      id: getNextId(),
      title,
      content,
      timestamp: new Date().toISOString()
    };
    blogs.unshift(newBlog);
    localStorage.setItem('blogs', JSON.stringify(blogs));
    return newBlog;
  };

  const getAllBlogs = () => {
    return JSON.parse(localStorage.getItem('blogs'));
  };

  return { saveBlog, getAllBlogs };
})();