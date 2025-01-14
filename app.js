class SnippetManager {
    constructor() {
        this.snippets = JSON.parse(localStorage.getItem('codeSnippets')) || [];
        this.filteredSnippets = this.snippets;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.renderSnippets();
        
        // Initialize syntax highlighting if hljs is available
        if (typeof hljs !== 'undefined') {
            hljs.highlightAll();
        }
    }
    
    bindEvents() {
        const form = document.getElementById('snippetForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        const searchInput = document.getElementById('searchInput');
        const languageFilter = document.getElementById('languageFilter');
        
        searchInput.addEventListener('input', () => this.filterSnippets());
        languageFilter.addEventListener('change', () => this.filterSnippets());
        
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');
        
        exportBtn.addEventListener('click', () => this.exportSnippets());
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', (e) => this.importSnippets(e));
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
        
        // Apply syntax highlighting to new content
        if (typeof hljs !== 'undefined') {
            container.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        }
    }
    
    createSnippetHTML(snippet) {
        return `
            <div class="snippet" data-id="${snippet.id}">
                <div class="snippet-header">
                    <h3>${snippet.title}</h3>
                    <span class="language-tag">${snippet.language || 'Plain Text'}</span>
                </div>
                <pre><code class="language-${snippet.language || 'plaintext'}">${this.escapeHTML(snippet.code)}</code></pre>
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
    
    exportSnippets() {
        const dataStr = JSON.stringify(this.snippets, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `snippets-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('Snippets exported successfully!');
    }
    
    importSnippets(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSnippets = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedSnippets)) {
                    throw new Error('Invalid file format');
                }
                
                const newSnippets = importedSnippets.filter(snippet => 
                    !this.snippets.some(existing => existing.id === snippet.id)
                );
                
                this.snippets = [...newSnippets, ...this.snippets];
                this.saveToStorage();
                this.filterSnippets();
                
                alert(`Imported ${newSnippets.length} new snippets!`);
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }
    
    clearForm() {
        document.getElementById('snippetForm').reset();
    }
}

const snippetManager = new SnippetManager();