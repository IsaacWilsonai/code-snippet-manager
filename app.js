class SnippetManager {
    constructor() {
        this.snippets = JSON.parse(localStorage.getItem('codeSnippets')) || [];
        this.filteredSnippets = this.snippets;
        this.editingId = null;
        this.showFavoritesOnly = false;
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
        
        const sortBy = document.getElementById('sortBy');
        
        searchInput.addEventListener('input', () => this.filterSnippets());
        languageFilter.addEventListener('change', () => this.filterSnippets());
        sortBy.addEventListener('change', () => this.filterSnippets());
        
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');
        
        exportBtn.addEventListener('click', () => this.exportSnippets());
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', (e) => this.importSnippets(e));
        
        const showFavoritesBtn = document.getElementById('showFavoritesBtn');
        const showAllBtn = document.getElementById('showAllBtn');
        
        showFavoritesBtn.addEventListener('click', () => this.toggleFavoriteFilter(true));
        showAllBtn.addEventListener('click', () => this.toggleFavoriteFilter(false));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('title').value;
        const language = document.getElementById('language').value;
        const code = document.getElementById('code').value;
        const tags = document.getElementById('tags').value;
        
        if (this.editingId) {
            // Update existing snippet
            const snippetIndex = this.snippets.findIndex(s => s.id === this.editingId);
            if (snippetIndex !== -1) {
                this.snippets[snippetIndex] = {
                    ...this.snippets[snippetIndex],
                    title,
                    language,
                    code,
                    tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                    updatedAt: new Date().toISOString()
                };
            }
            this.editingId = null;
            document.querySelector('#snippetForm button[type="submit"]').textContent = 'Save Snippet';
        } else {
            // Create new snippet
            const snippet = {
                id: Date.now(),
                title,
                language,
                code,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                createdAt: new Date().toISOString(),
                favorite: false
            };
            this.snippets.unshift(snippet);
        }
        
        this.saveToStorage();
        this.filterSnippets();
        this.clearForm();
    }
    
    editSnippet(id) {
        const snippet = this.snippets.find(s => s.id == id);
        if (snippet) {
            document.getElementById('title').value = snippet.title;
            document.getElementById('language').value = snippet.language || '';
            document.getElementById('code').value = snippet.code;
            document.getElementById('tags').value = snippet.tags.join(', ');
            
            this.editingId = parseInt(id);
            document.querySelector('#snippetForm button[type="submit"]').textContent = 'Update Snippet';
            
            // Scroll to form
            document.getElementById('snippetForm').scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    saveToStorage() {
        localStorage.setItem('codeSnippets', JSON.stringify(this.snippets));
    }
    
    toggleFavoriteFilter(showFavoritesOnly) {
        this.showFavoritesOnly = showFavoritesOnly;
        
        // Update button states
        const showFavoritesBtn = document.getElementById('showFavoritesBtn');
        const showAllBtn = document.getElementById('showAllBtn');
        
        showFavoritesBtn.classList.toggle('active', showFavoritesOnly);
        showAllBtn.classList.toggle('active', !showFavoritesOnly);
        
        this.filterSnippets();
    }
    
    filterSnippets() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const languageFilter = document.getElementById('languageFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        
        this.filteredSnippets = this.snippets.filter(snippet => {
            const matchesSearch = snippet.title.toLowerCase().includes(searchTerm) ||
                                snippet.code.toLowerCase().includes(searchTerm) ||
                                snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            
            const matchesLanguage = !languageFilter || snippet.language === languageFilter;
            const matchesFavorite = !this.showFavoritesOnly || snippet.favorite;
            
            return matchesSearch && matchesLanguage && matchesFavorite;
        });
        
        // Sort the filtered snippets
        this.sortSnippets(sortBy);
        
        this.renderSnippets();
    }
    
    sortSnippets(sortBy) {
        switch(sortBy) {
            case 'oldest':
                this.filteredSnippets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'title':
                this.filteredSnippets.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
                break;
            case 'title-desc':
                this.filteredSnippets.sort((a, b) => b.title.toLowerCase().localeCompare(a.title.toLowerCase()));
                break;
            case 'favorites':
                this.filteredSnippets.sort((a, b) => {
                    if (a.favorite === b.favorite) {
                        return new Date(b.createdAt) - new Date(a.createdAt); // newest first for same favorite status
                    }
                    return b.favorite - a.favorite; // favorites first
                });
                break;
            case 'newest':
            default:
                this.filteredSnippets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
    }
    
    renderSnippets() {
        const container = document.getElementById('snippetsList');
        
        // Update snippet count
        this.updateSnippetCount();
        
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
    
    updateSnippetCount() {
        const countElement = document.getElementById('snippetCount');
        const total = this.snippets.length;
        const filtered = this.filteredSnippets.length;
        
        if (total === filtered) {
            countElement.textContent = `${total} snippet${total !== 1 ? 's' : ''}`;
        } else {
            countElement.textContent = `${filtered} of ${total} snippet${total !== 1 ? 's' : ''}`;
        }
    }
    
    createSnippetHTML(snippet) {
        return `
            <div class="snippet" data-id="${snippet.id}">
                <div class="snippet-header">
                    <div class="snippet-title-section">
                        <h3>
                            ${snippet.favorite ? '<span class="star-icon">★</span>' : ''} 
                            ${snippet.title}
                        </h3>
                        <small class="snippet-date">${this.formatDate(snippet.createdAt)}</small>
                    </div>
                    <span class="language-tag">${snippet.language || 'Plain Text'}</span>
                </div>
                <div class="code-container">
                    <div class="code-header">
                        <span>${snippet.language || 'Plain Text'}</span>
                        <span>${snippet.code.split('\n').length} lines</span>
                    </div>
                    <div class="code-with-lines">
                        <div class="line-numbers">${this.generateLineNumbers(snippet.code)}</div>
                        <pre><code class="language-${snippet.language || 'plaintext'}">${this.escapeHTML(snippet.code)}</code></pre>
                    </div>
                </div>
                <div class="snippet-footer">
                    <div class="tags">
                        ${snippet.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="actions">
                        <button onclick="snippetManager.toggleFavorite('${snippet.id}')" class="favorite-btn ${snippet.favorite ? 'favorited' : ''}">
                            ${snippet.favorite ? '★' : '☆'}
                        </button>
                        <button onclick="snippetManager.copySnippet('${snippet.id}')">Copy</button>
                        <button onclick="snippetManager.editSnippet('${snippet.id}')" class="edit-btn">Edit</button>
                        <button onclick="snippetManager.deleteSnippet('${snippet.id}')" class="delete-btn">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    generateLineNumbers(code) {
        const lines = code.split('\n').length;
        return Array.from({length: lines}, (_, i) => i + 1).join('\n');
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
    
    toggleFavorite(id) {
        const snippet = this.snippets.find(s => s.id == id);
        if (snippet) {
            snippet.favorite = !snippet.favorite;
            this.saveToStorage();
            this.filterSnippets();
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
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S to focus on save form
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            document.getElementById('title').focus();
        }
        
        // Ctrl/Cmd + F to focus on search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Ctrl/Cmd + E to export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.exportSnippets();
        }
        
        // Escape to clear form
        if (e.key === 'Escape') {
            this.clearForm();
        }
    }
    
    clearForm() {
        document.getElementById('snippetForm').reset();
        this.editingId = null;
        document.querySelector('#snippetForm button[type="submit"]').textContent = 'Save Snippet';
    }
}

const snippetManager = new SnippetManager();