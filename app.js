class SnippetManager {
    constructor() {
        this.snippets = JSON.parse(localStorage.getItem('codeSnippets')) || [];
        this.filteredSnippets = this.snippets;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.renderSnippets();
    }
    
    bindEvents() {
        const form = document.getElementById('snippetForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        const searchInput = document.getElementById('searchInput');
        const languageFilter = document.getElementById('languageFilter');
        
        searchInput.addEventListener('input', () => this.filterSnippets());
        languageFilter.addEventListener('change', () => this.filterSnippets());
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('title').value;
        const language = document.getElementById('language').value;
        const code = document.getElementById('code').value;
        const tags = document.getElementById('tags').value;
        
        const snippet = {
            id: Date.now(),
            title,
            language,
            code,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            createdAt: new Date().toISOString()
        };
        
        this.addSnippet(snippet);
        this.clearForm();
    }
    
    addSnippet(snippet) {
        this.snippets.unshift(snippet);
        this.saveToStorage();
        this.filterSnippets();
    }
    
    saveToStorage() {
        localStorage.setItem('codeSnippets', JSON.stringify(this.snippets));
    }
    
    filterSnippets() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const languageFilter = document.getElementById('languageFilter').value;
        
        this.filteredSnippets = this.snippets.filter(snippet => {
            const matchesSearch = snippet.title.toLowerCase().includes(searchTerm) ||
                                snippet.code.toLowerCase().includes(searchTerm) ||
                                snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            
            const matchesLanguage = !languageFilter || snippet.language === languageFilter;
            
            return matchesSearch && matchesLanguage;
        });
        
        this.renderSnippets();
    }
    
    renderSnippets() {
        const container = document.getElementById('snippetsList');
        
        if (this.filteredSnippets.length === 0) {
            if (this.snippets.length === 0) {
                container.innerHTML = '<p class="no-snippets">No snippets yet. Add your first one!</p>';
            } else {
                container.innerHTML = '<p class="no-snippets">No snippets match your search.</p>';
            }
            return;
        }
        
        container.innerHTML = this.filteredSnippets.map(snippet => this.createSnippetHTML(snippet)).join('');
    }
    
    createSnippetHTML(snippet) {
        return `
            <div class="snippet" data-id="${snippet.id}">
                <div class="snippet-header">
                    <h3>${snippet.title}</h3>
                    <span class="language-tag">${snippet.language || 'Plain Text'}</span>
                </div>
                <pre><code>${this.escapeHTML(snippet.code)}</code></pre>
                <div class="snippet-footer">
                    <div class="tags">
                        ${snippet.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="actions">
                        <button onclick="snippetManager.copySnippet('${snippet.id}')">Copy</button>
                        <button onclick="snippetManager.deleteSnippet('${snippet.id}')" class="delete-btn">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    copySnippet(id) {
        const snippet = this.snippets.find(s => s.id == id);
        if (snippet) {
            navigator.clipboard.writeText(snippet.code).then(() => {
                alert('Snippet copied to clipboard!');
            });
        }
    }
    
    deleteSnippet(id) {
        if (confirm('Are you sure you want to delete this snippet?')) {
            this.snippets = this.snippets.filter(s => s.id != id);
            this.saveToStorage();
            this.filterSnippets();
        }
    }
    
    clearForm() {
        document.getElementById('snippetForm').reset();
    }
}

const snippetManager = new SnippetManager();