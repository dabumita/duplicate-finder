// Импортируем необходимые API из Obsidian
const { Plugin, Notice } = require('obsidian');

module.exports = class DuplicateFinder extends Plugin {
    async onload() {
        console.log("Duplicate Finder загружен!");

        // Добавляем команду в палитру
        this.addCommand({
            id: 'find-duplicate-urls',
            name: 'Найти дубликаты URL',
            callback: () => this.checkForDuplicates()
        });

        // Подписываемся на событие смены активного файла
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.checkForDuplicates()));
        
        // Подписываемся на событие изменения текста в редакторе
        this.registerEvent(this.app.workspace.on('editor-change', () => this.checkForDuplicates()));
        
        // Первая проверка
        this.checkForDuplicates();
    }

    async checkForDuplicates() {
        // Получаем текущий активный файл
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return;

        // Читаем его содержимое
        const content = await this.app.vault.cachedRead(activeFile);
        const lines = content.split('\n');
        
        // Регулярное выражение для поиска URL
        const urlRegex = /(https?:\/\/[^\s<>]+|www\.[^\s<>]+)/gi;
        const duplicateLines = [];
        const globalUrlSet = new Set();
        const duplicateUrlSet = new Set();

        // Сначала находим все URL, чтобы определить дубликаты
        for (const line of lines) {
            let match;
            while ((match = urlRegex.exec(line)) !== null) {
                const url = match[0];
                if (globalUrlSet.has(url)) {
                    duplicateUrlSet.add(url);
                } else {
                    globalUrlSet.add(url);
                }
            }
        }

        // Сбрасываем lastIndex для регулярного выражения перед повторным проходом
        for (const line of lines) {
            urlRegex.lastIndex = 0;
            const lineUrls = new Set();
            let match;
            while ((match = urlRegex.exec(line)) !== null) {
                const url = match[0];
                if (lineUrls.has(url) || duplicateUrlSet.has(url)) {
                    duplicateLines.push(lines.indexOf(line));
                    break;
                }
                lineUrls.add(url);
            }
        }

        // Убираем дубликаты строк
        const uniqueDuplicateLines = [...new Set(duplicateLines)];
        
        if (uniqueDuplicateLines.length > 0) {
            new Notice(`Найдены дубликаты ссылок в строках: ${uniqueDuplicateLines.map(n => n+1).join(", ")}`);
            // Здесь потом добавим подсветку строк
        } else {
            new Notice("Дубликатов URL не найдено");
            // Здесь потом очистим подсветку
        }
    }
}