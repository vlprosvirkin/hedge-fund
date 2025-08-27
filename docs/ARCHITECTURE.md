# Архитектура системы

## 🏗️ Обзор архитектуры

Hedge Fund AI Trading System построена на принципах микросервисной архитектуры с использованием многоагентного подхода для принятия торговых решений.

### 🎯 Основные компоненты

```mermaid
graph TB
    subgraph "Data Sources"
        A[Binance API]
        B[News API]
        C[Technical Indicators API]
    end
    
    subgraph "AI Agents"
        D[Fundamental Agent]
        E[Sentiment Agent]
        F[Technical Agent]
    end
    
    subgraph "Core System"
        G[Orchestrator]
        H[Consensus Engine]
        I[Risk Manager]
        J[Signal Processor]
    end
    
    subgraph "Trading"
        K[Aspis API]
        L[Order Execution]
        M[Portfolio Manager]
    end
    
    subgraph "Storage"
        N[PostgreSQL]
        O[Redis Cache]
    end
    
    subgraph "Notifications"
        P[Telegram Bot]
        Q[Logging System]
    end
    
    A --> G
    B --> G
    C --> G
    G --> D
    G --> E
    G --> F
    D --> H
    E --> H
    F --> H
    H --> I
    I --> J
    J --> K
    K --> L
    L --> M
    M --> N
    G --> O
    G --> P
    G --> Q
```

## 🤖 AI Агенты

### 📊 Fundamental Agent
Анализирует фундаментальные показатели:
- Объем торгов
- Ликвидность
- Волатильность
- Рыночная капитализация

### 📰 Sentiment Agent
Обрабатывает новости и настроения:
- Анализ новостей
- Социальные медиа
- Рыночная психология

### 📈 Technical Agent
Технический анализ:
- RSI, MACD, Bollinger Bands
- Паттерны графиков
- Ценовое действие

## 🔄 Процесс принятия решений

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant FA as Fundamental Agent
    participant SA as Sentiment Agent
    participant TA as Technical Agent
    participant CE as Consensus Engine
    participant RM as Risk Manager
    participant TE as Trading Execution
    
    O->>FA: Анализ фундаменталов
    O->>SA: Анализ настроений
    O->>TA: Технический анализ
    
    FA-->>O: Claims
    SA-->>O: Claims
    TA-->>O: Claims
    
    O->>CE: Объединение claims
    CE->>CE: Консенсус
    CE-->>O: Consensus
    
    O->>RM: Проверка рисков
    RM-->>O: Risk assessment
    
    O->>TE: Исполнение торгов
    TE-->>O: Orders
```

## 💾 Хранение данных

### PostgreSQL
- **claims** - утверждения агентов
- **consensus** - консенсусные решения
- **evidence** - доказательства
- **news** - новости
- **orders** - ордера
- **positions** - позиции
- **rounds** - торговые раунды
- **risk_violations** - нарушения рисков

### Redis
- Кэширование API ответов
- Временные данные
- Сессии

## 🔌 API Интеграции

### Binance API
- Рыночные данные
- Цены в реальном времени
- Объемы торгов

### Aspis API v2
- Исполнение ордеров
- Управление портфелем
- Позиции

### News API
- Новости криптовалют
- Анализ настроений
- Источники новостей

### Technical Indicators API
- Технические индикаторы
- Метаданные активов
- Сигналы

## 📱 Уведомления

### Telegram Bot
- Анализ агентов
- Консенсусные решения
- Исполнение ордеров
- Управление рисками

### Логирование
- Структурированные логи
- Отслеживание ошибок
- Метрики производительности

## 🚀 Масштабируемость

### Горизонтальное масштабирование
- Независимые агенты
- Микросервисная архитектура
- Кэширование

### Вертикальное масштабирование
- Оптимизация запросов
- Индексы БД
- Асинхронная обработка

## 🔒 Безопасность

### API Безопасность
- Аутентификация
- Авторизация
- Rate limiting

### Данные
- Шифрование в покое
- Шифрование в движении
- Резервное копирование

### Торговля
- Управление рисками
- Лимиты позиций
- Kill switch
