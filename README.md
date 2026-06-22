# Foray

Локальное мобильное приложение для поиска собеседников по интересам и общения.

## Запуск

```bash
npm install
npm run dev
```

## Проверка

```bash
npm run type-check
npm run build
```

## iOS

```bash
npm run ios:sync
npm run ios:build
npm run ios:open
```

`ios:sync` собирает web часть и переносит её в Xcode проект.

`ios:build` выполняет Debug сборку для iPhone Simulator без подписи.

`ios:open` открывает проект в Xcode для запуска на физическом iPhone.

## Структура проекта

```plaintext
src/
├── app/          # маршруты и композиция приложения
├── features/     # функциональные модули
├── shared/       # общая инфраструктура и функции
├── styles/       # глобальные стили
├── App.tsx
└── main.tsx
```

Подробное назначение директорий описано в
[`docs/architecture/directories.md`](docs/architecture/directories.md).

Контракты данных описаны в
[`docs/architecture/data-contracts.md`](docs/architecture/data-contracts.md).

Используемые иконки хранятся локально в
[`src/shared/icons`](src/shared/icons).
