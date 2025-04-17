import { Directive, Input, ElementRef } from '@angular/core';

@Directive({
  selector: '[libSearchInElement]'
})
export class SearchInElementDirective {
  @Input() highlightStyle: Object = {};
  @Input() currentMatchStyle: Object = {};
  @Input() searchText: string = '';
  constructor(
    private elementRef: ElementRef
  ) { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.searchEngine = new ElementSearchEngine(this.elementRef.nativeElement, this.highlightStyle, this.currentMatchStyle);
      if (this.searchEngine) {
        this.searchAndHighlight();
      }
    }, 1000)
  }

  searchAndHighlight() {
    this.matchCount = this.searchEngine?.search(this.searchText, false, true) || 0;
  }

  next() {
    this.searchEngine?.next();
    if (this.nowSearchIndex < this.matchCount) {
      this.nowSearchIndex++;
    } else {
      this.nowSearchIndex = 0;
    }
  }

  previous() {
    this.searchEngine?.previous();
    if (this.nowSearchIndex > 0) {
      this.nowSearchIndex--;
    } else {
      this.nowSearchIndex = this.matchCount - 1;
    }
  }

  clearHighlight() {
    this.searchEngine?.clearHighlights();
    this.nowSearchIndex = 0;
    this.matchCount = 0;
  }

  public searchEngine: ElementSearchEngine | null = null;
  public nowSearchIndex = 0;
  public matchCount = 0;
}



class ElementSearchEngine {
  constructor(element: any, highlightStyle: Object, currentMatchStyle: Object) {
    this.highlightStyle = highlightStyle;
    this.currentMatchStyle = currentMatchStyle;
    this.element = element;
    this.matches = [];
    this.currentMatchIndex = -1;
    this.highlightAll = false; // 是否高亮所有匹配项
  }

  public highlightAll: boolean = false;
  public element: any;
  public matches: any[] = [];
  public currentMatchIndex: number = -1;
  public highlightStyle: Object = {};
  public currentMatchStyle: Object = {};
  
  search(text: any, caseSensitive = false, highlightAll = false) {
    // 清除之前的高亮
    this.clearHighlights();
    this.highlightAll = highlightAll;
    
    // 获取所有文本节点
    const textNodes = [];
    const walker = document.createTreeWalker(
      this.element,
      NodeFilter.SHOW_TEXT,
      null,
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    // 搜索文本
    this.matches = [];
    const searchText = caseSensitive ? text : text.toLowerCase();
    
    textNodes.forEach((node: any) => {
      const nodeText = caseSensitive ? node.nodeValue : node.nodeValue?.toLowerCase();
      let startIndex = 0;
      let index;
      
      while ((index = nodeText?.indexOf(searchText, startIndex)) > -1) {
        this.matches.push({
          node,
          startIndex: index,
          endIndex: index + searchText.length,
          originalText: node.nodeValue?.substring(index, index + searchText.length),
          marked: false // 标记是否已被处理
        });
        startIndex = index + 1;
      }
    });
    
    this.currentMatchIndex = this.matches.length > 0 ? 0 : -1;
    
    // 如果需要高亮所有匹配项
    if (this.highlightAll) {
      this.highlightAllMatches();
    }
    
    // 高亮当前匹配项
    this.highlightCurrentMatch();
    
    return this.matches.length;
  }
  
  // 高亮所有匹配项
  highlightAllMatches() {
    // 创建文档片段以减少DOM操作次数
    const mapNodeToFragments = new Map();
    
    // 按节点对匹配项进行分组
    const matchesByNode: any = {};
    this.matches.forEach((match, index) => {
      const nodeId = match.node.uniqueId || (match.node.uniqueId = Date.now() + "_" + index);
      if (!matchesByNode[nodeId]) {
        matchesByNode[nodeId] = {
          node: match.node,
          matches: []
        };
      }
      matchesByNode[nodeId].matches.push({...match, index});
    });
    
    // 按节点处理匹配项，从后向前
    Object.values(matchesByNode).forEach((nodeData: any) => {
      const {node, matches} = nodeData;
      
      // 对当前节点的匹配项从后向前排序
      matches.sort((a: any, b: any) => b.startIndex - a.startIndex);
      
      const originalText = node.nodeValue;
      let lastIndex = originalText.length;
      
      // 创建DocumentFragment来存储处理结果
      const fragment = document.createDocumentFragment();
      
      // 从后向前处理所有匹配
      matches.forEach((match: any) => {
        // 添加匹配后的文本
        if (lastIndex > match.endIndex) {
          const textAfter = originalText.substring(match.endIndex, lastIndex);
          fragment.insertBefore(document.createTextNode(textAfter), fragment.firstChild);
        }
        
        // 创建高亮元素或当前匹配元素
        const span = document.createElement('span');
        if (match.index === this.currentMatchIndex) {
          span.className = 'current-match';
        } else {
          span.className = 'highlight-match';
          Object.assign(span.style, this.highlightStyle);
        }
        span.textContent = match.originalText;
        span.setAttribute('data-match-index', match.index);
        fragment.insertBefore(span, fragment.firstChild);
        
        // 更新匹配项数据
        this.matches[match.index].highlightElement = span;
        this.matches[match.index].marked = true;
        
        lastIndex = match.startIndex;
      });
      
      // 添加最前面的文本
      if (lastIndex > 0) {
        const textBefore = originalText.substring(0, lastIndex);
        fragment.insertBefore(document.createTextNode(textBefore), fragment.firstChild);
      }
      
      // 替换原始节点
      node.parentNode.replaceChild(fragment, node);
    });
  }
  
  highlightCurrentMatch() {
    if (this.currentMatchIndex >= 0 && this.matches.length > 0) {
      const match = this.matches[this.currentMatchIndex];
      
      if (this.highlightAll) {
        // 已经在highlightAllMatches中处理了所有匹配项
        const currentElement = this.element.querySelector(`.highlight-match[data-match-index="${this.currentMatchIndex}"]`);
        if (currentElement) {
          currentElement.className = 'current-match';
          Object.assign(currentElement.style, this.currentMatchStyle);
          // todo 滚动到当前匹配项 ， 有可能存在问题
          currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // 寻找当前匹配
          const matchElement = this.element.querySelector(`[data-match-index="${this.currentMatchIndex}"]`);
          if (matchElement) {
            matchElement.className = 'current-match';
            Object.assign(matchElement.style, this.currentMatchStyle);
          // todo 滚动到当前匹配项 ， 有可能存在问题
            matchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      } else {
        // 单独高亮当前匹配项
        if (match.marked) {
          // 如果已经处理过，直接找到对应元素
          const matchElement = this.element.querySelector(`[data-match-index="${this.currentMatchIndex}"]`);
          if (matchElement) {
            matchElement.className = 'current-match';
            Object.assign(matchElement.style, this.currentMatchStyle);
            // todo 滚动到当前匹配项 ， 有可能存在问题
            matchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
        
        // 创建范围来选择匹配的文本
        try {
          const range = document.createRange();
          range.setStart(match.node, match.startIndex);
          range.setEnd(match.node, match.endIndex);
          
          // 高亮显示并滚动到可见区域
          const span = document.createElement('span');
          span.className = 'current-match';
          Object.assign(span.style, this.currentMatchStyle);
          span.setAttribute('data-match-index', this.currentMatchIndex.toString());
          
          range.surroundContents(span);
          match.highlightElement = span;
          match.marked = true;
          // todo 滚动到当前匹配项 ， 有可能存在问题
          span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
          console.error('Error highlighting current match:', e);
          // 如果失败，尝试重新搜索并更新匹配项的位置
          this.updateMatchPositions();
          this.highlightCurrentMatch();
        }
      }
    }
  }
  
  // 更新匹配项位置
  updateMatchPositions() {
    if (this.matches.length === 0) return;
    
    // 保存原始文本，用于重新定位
    const originalTexts = this.matches.map(match => match.originalText);
    
    // 清除所有高亮
    this.clearHighlights();
    
    // 重新获取所有文本节点
    const textNodes: any[] = [];
    const walker = document.createTreeWalker(
      this.element,
      NodeFilter.SHOW_TEXT,
      null,
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    // 重新找到所有匹配项
    this.matches = [];
    originalTexts.forEach((text) => {
      textNodes.forEach(node => {
        const nodeText = node.nodeValue;
        let startIndex = 0;
        let index;
        
        while ((index = nodeText.indexOf(text, startIndex)) > -1) {
          this.matches.push({
            node,
            startIndex: index,
            endIndex: index + text.length,
            originalText: text,
            marked: false
          });
          startIndex = index + 1;
        }
      });
    });
    
    // 如果没有找到任何匹配项，重置索引
    if (this.matches.length === 0) {
      this.currentMatchIndex = -1;
    } else if (this.currentMatchIndex >= this.matches.length) {
      this.currentMatchIndex = 0;
    }
  }
  
  next() {
    if (this.matches.length > 0) {
      // 变更当前匹配项的样式
      if (this.highlightAll) {
        const currentElement = this.element.querySelector(`.current-match`);
        if (currentElement) {
          currentElement.className = 'highlight-match';
          Object.assign(currentElement.style, this.highlightStyle);
        }
      } else {
        this.clearCurrentHighlight();
      }
      
      // 更新索引
      this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length;
      
      // 高亮新的当前匹配项
      this.highlightCurrentMatch();
      return true;
    }
    return false;
  }
  
  previous() {
    if (this.matches.length > 0) {
      // 变更当前匹配项的样式
      if (this.highlightAll) {
        const currentElement = this.element.querySelector(`.current-match`);
        if (currentElement) {
          currentElement.className = 'highlight-match';
          Object.assign(currentElement.style, this.highlightStyle);
        }
      } else {
        this.clearCurrentHighlight();
      }
      
      // 更新索引
      this.currentMatchIndex = (this.currentMatchIndex - 1 + this.matches.length) % this.matches.length;
      
      // 高亮新的当前匹配项
      this.highlightCurrentMatch();
      return true;
    }
    return false;
  }
  
  // 只清除当前高亮
  clearCurrentHighlight() {
    const currentHighlights = this.element.querySelectorAll('.current-match');
    currentHighlights.forEach((el: any) => {
      const parent = el.parentNode;
      const text = el.textContent;
      const matchIndex = el.getAttribute('data-match-index');
      
      // 如果需要保留所有匹配项的高亮，则替换为普通高亮
      if (this.highlightAll && matchIndex !== null) {
        const span = document.createElement('span');
        span.className = 'highlight-match';
        span.textContent = text;
        span.setAttribute('data-match-index', matchIndex);
        parent.replaceChild(span, el);
        
        // 更新对应match的引用
        if (matchIndex !== null) {
          const index = parseInt(matchIndex);
          if (index >= 0 && index < this.matches.length) {
            this.matches[index].highlightElement = span;
          }
        }
      } else {
        // 否则直接替换为文本节点
        parent.replaceChild(document.createTextNode(text), el);
        parent.normalize();
        
        // 标记为未处理
        if (matchIndex !== null) {
          const index = parseInt(matchIndex);
          if (index >= 0 && index < this.matches.length) {
            this.matches[index].marked = false;
            this.matches[index].highlightElement = null;
          }
        }
      }
    });
  }
  
  // 清除所有高亮
  clearHighlights() {
    // 清除当前匹配高亮
    const currentHighlights = this.element.querySelectorAll('.current-match');
    currentHighlights.forEach((el: any) => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    
    // 清除普通高亮
    const highlights = this.element.querySelectorAll('.highlight-match');
    highlights.forEach((el: any) => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    
    // 重置所有匹配项的标记
    this.matches.forEach(match => {
      match.marked = false;
      match.highlightElement = null;
    });
  }
  
  // 获取当前匹配信息
  getCurrentMatchInfo() {
    if (this.currentMatchIndex >= 0 && this.matches.length > 0) {
      return {
        index: this.currentMatchIndex,
        total: this.matches.length,
        text: this.matches[this.currentMatchIndex].originalText
      };
    }
    return { index: -1, total: this.matches.length, text: '' };
  }
}