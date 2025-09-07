class SnippetManager {
    constructor() {
        this.snippets = JSON.parse(localStorage.getItem('codeSnippets')) || [];
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.renderSnippets();
    }
    
    bindEvents() {
        const form = document.getElementById('snippetForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
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
        this.renderSnippets();
    }
    
    saveToStorage() {
        localStorage.setItem('codeSnippets', JSON.stringify(this.snippets));
    }
    
    renderSnippets() {
        const container = document.getElementById('snippetsList');
        
        if (this.snippets.length === 0) {
            container.innerHTML = '<p class="no-snippets">No snippets yet. Add your first one!</p>';
            return;
        }
        
        container.innerHTML = this.snippets.map(snippet => this.createSnippetHTML(snippet)).join('');
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
            this.renderSnippets();
        }
    }
    
    clearForm() {
        document.getElementById('snippetForm').reset();
    }
}

const snippetManager = new SnippetManager();