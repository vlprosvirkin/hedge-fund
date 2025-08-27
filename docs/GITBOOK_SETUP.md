# Настройка GitBook

## 🚀 Пошаговая инструкция

### 1. Создание аккаунта в GitBook

1. Перейдите на [gitbook.com](https://gitbook.com)
2. Зарегистрируйтесь или войдите в аккаунт
3. Создайте новое пространство (Space)

### 2. Подключение GitHub репозитория

#### Вариант A: Автоматическая синхронизация

1. В GitBook перейдите в настройки пространства
2. Выберите "GitHub Integration"
3. Подключите ваш GitHub аккаунт
4. Выберите репозиторий `vlprosvirkin/hedge-fund`
5. Укажите ветку `main` и папку `docs`

#### Вариант B: Ручная загрузка

1. Склонируйте репозиторий локально
2. Установите GitBook CLI:
   ```bash
   npm install -g gitbook-cli
   ```
3. Перейдите в папку docs:
   ```bash
   cd docs
   ```
4. Установите зависимости:
   ```bash
   gitbook install
   ```
5. Соберите документацию:
   ```bash
   gitbook build
   ```

### 3. Настройка автоматического деплоя

#### GitHub Actions

1. В репозитории уже создан файл `.github/workflows/gitbook.yml`
2. Добавьте секреты в GitHub:
   - `GITBOOK_TOKEN` - токен доступа к GitBook API
   - `GITBOOK_SPACE_ID` - ID вашего пространства

#### Настройка токена GitBook

1. В GitBook перейдите в настройки аккаунта
2. Выберите "API Tokens"
3. Создайте новый токен с правами на запись
4. Скопируйте токен в GitHub Secrets

### 4. Настройка домена

1. В GitBook перейдите в настройки пространства
2. Выберите "Custom Domain"
3. Добавьте ваш домен (например, `docs.hedge-fund.com`)
4. Настройте DNS записи

### 5. Настройка поиска

1. В настройках пространства включите "Search"
2. Настройте индексацию
3. Добавьте метаданные для лучшего поиска

## 🔧 Конфигурация

### book.json

Основной файл конфигурации уже создан в `docs/book.json`:

```json
{
  "title": "Hedge Fund AI Trading System",
  "description": "Документация по интеллектуальной системе торговли криптовалютами",
  "author": "Vladimir Prosvirkin",
  "language": "ru",
  "plugins": [
    "mermaid-gb3",
    "theme-default",
    "search",
    "copy-code-button",
    "expandable-chapters",
    "back-to-top-button",
    "github",
    "edit-link"
  ]
}
```

### Плагины

Установленные плагины:
- **mermaid-gb3** - диаграммы Mermaid
- **search** - поиск по документации
- **copy-code-button** - кнопка копирования кода
- **expandable-chapters** - сворачиваемые главы
- **back-to-top-button** - кнопка "наверх"
- **github** - интеграция с GitHub
- **edit-link** - ссылки на редактирование

## 📝 Структура документации

```
docs/
├── README.md              # Главная страница
├── SUMMARY.md             # Оглавление
├── book.json              # Конфигурация
├── QUICKSTART.md          # Быстрый старт
├── ARCHITECTURE.md        # Архитектура
├── AGENTS.md              # AI агенты
├── DATABASE_SCHEMA.md     # Схема БД
├── API_TYPES.md           # Типы API
├── SIGNAL_PROCESSING.md   # Обработка сигналов
├── TECHNICAL_INDICATORS.md # Технические индикаторы
├── NEWS_API.md            # API новостей
├── TELEGRAM_BOT.md        # Telegram бот
├── DEPLOYMENT.md          # Развертывание
└── GITBOOK_SETUP.md       # Эта инструкция
```

## 🔄 Автоматическое обновление

### При push в main ветку

1. GitHub Actions автоматически собирает документацию
2. Деплоит в GitBook
3. Обновляет live версию

### При создании Pull Request

1. Создается preview версия
2. Добавляется комментарий с ссылкой
3. Можно проверить изменения перед мержем

## 🎨 Кастомизация

### Темы

Можно изменить тему в `book.json`:

```json
{
  "plugins": [
    "theme-default",
    "theme-api"
  ]
}
```

### CSS стили

Создайте файл `docs/styles/website.css`:

```css
.book-summary {
    background-color: #f8f9fa;
}

.book-body {
    font-family: 'Inter', sans-serif;
}
```

### JavaScript

Создайте файл `docs/styles/website.js`:

```javascript
gitbook.events.on('page.change', function() {
    // Кастомная логика
});
```

## 📊 Аналитика

### Google Analytics

Добавьте в `book.json`:

```json
{
  "pluginsConfig": {
    "ga": {
      "token": "UA-XXXXXXXXX-X"
    }
  }
}
```

### GitBook Analytics

Встроенная аналитика доступна в настройках пространства.

## 🔍 SEO

### Метаданные

Добавьте в каждую страницу:

```markdown
---
title: "Заголовок страницы"
description: "Описание страницы"
keywords: "ключевые, слова"
---
```

### Sitemap

GitBook автоматически генерирует sitemap.xml

## 🚀 Продвижение

### Социальные сети

Добавьте кнопки шаринга в `book.json`:

```json
{
  "plugins": [
    "sharing"
  ],
  "pluginsConfig": {
    "sharing": {
      "facebook": true,
      "twitter": true,
      "linkedin": true
    }
  }
}
```

### Комментарии

Добавьте систему комментариев:

```json
{
  "plugins": [
    "disqus"
  ],
  "pluginsConfig": {
    "disqus": {
      "shortName": "your-disqus-shortname"
    }
  }
}
```

## 🆘 Поддержка

### Полезные ссылки

- [GitBook Documentation](https://docs.gitbook.com/)
- [GitBook CLI](https://github.com/GitbookIO/gitbook-cli)
- [GitBook Plugins](https://plugins.gitbook.com/)

### Контакты

- **GitHub Issues**: [Создать issue](https://github.com/vlprosvirkin/hedge-fund/issues)
- **Email**: support@hedge-fund.com
- **Telegram**: @hedge_fund_support
