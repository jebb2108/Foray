# Канонические контракты данных

Интерфейс работает с доменными моделями из `src/features`, а чтение старых
записей `localStorage` выполняется только внутри repository-слоя.

## Сообщение

```ts
interface ForayMessage {
  id: string;
  chatId: string;
  sender: { type: 'user' | 'system'; id: string };
  isOutgoing: boolean;
  sentAt: string;
  editedAt?: string;
  delivery: {
    state: 'pending' | 'sent' | 'read' | 'failed';
    errorCode?: string;
    canRetry?: boolean;
  };
  content: { type: 'text'; text: string };
  replyTo?: {
    chatId: string;
    messageId: string;
    senderId: string;
    previewText: string;
    quote?: string;
  };
  reactions: Array<{
    emoji: string;
    count: number;
    isSelectedByMe: boolean;
  }>;
  permissions: {
    canBeEdited: boolean;
    canBeDeleted: boolean;
    canBeSaved: boolean;
  };
}
```

Структура адаптирует подход TDLib: сообщение отдельно хранит идентификаторы
сообщения и чата, отправителя, направление, состояние отправки, контент,
ответ и реакции. Контент оформлен как discriminated union, чтобы позже
добавлять изображения, файлы и другие типы без изменения базового объекта.

Официальные ориентиры:

- [TDLib message](https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1message.html)
- [TDLib MessageContent](https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1_message_content.html)
- [TDLib messageReactions](https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1message_reactions.html)

## Хранилища

Все записи имеют оболочку `{ schemaVersion, data }`:

- `foray.user.v2`
- `foray.profile-settings.v2`
- `foray.messaging.v2`

Repository-слой проверяет типы, нормализует строки, даты, массивы и числа,
отбрасывает повреждённые сущности и мигрирует старые ключи `foray.local-*.v1`.
UI не обращается к `localStorage` напрямую.
