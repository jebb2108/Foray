# Backend API Foray

Документ описывает запросы, под которые подготовлен frontend-слой. Базовый URL берётся из `VITE_FORAY_API_URL`, fallback для разработки — `/api`.

## Регистрация

Файл: `src/features/onboarding/api/registrationApi.ts`

- `GET /registration/username?username=:username`
  - проверяет доступность никнейма
  - ответ: `{ username, available }`
- `POST /registration/users`
  - создаёт пользователя
  - тело: `UserProfileDraft`
  - ответ: `ApiUserProfile`
- `POST /registration/users/:userId/complete`
  - завершает onboarding и сохраняет выбранные интересы
  - тело: `{ interestIds: string[] }`
  - ответ: `ApiUserProfile`

## Профиль

Файл: `src/features/profile/api/profileApi.ts`

- `GET /users/me`
  - возвращает текущего пользователя
  - ответ: `ApiUserProfile`
- `PATCH /users/:userId`
  - обновляет имя, ник, город, дату рождения, описание
  - тело: `UserProfileChanges`
  - ответ: `ApiUserProfile`
- `PUT /users/:userId/interests`
  - заменяет список интересов
  - тело: `{ interestIds: string[] }`
  - ответ: `ApiUserProfile`

## Чаты и сообщения

Файл: `src/features/messaging/api/messagingApi.ts`

- `GET /messaging/chats`
  - список чатов
  - ответ: `ApiChat[]`
- `POST /messaging/chats`
  - создаёт личный чат, группу или канал
  - тело: `{ type, title, participantIds? }`
  - ответ: `ApiChat`
- `DELETE /messaging/chats/:chatId`
  - удаляет чат у пользователя
  - ответ: `{ ok: true }`
- `GET /messaging/chats/:chatId/messages`
  - история сообщений
  - ответ: `ApiMessage[]`
- `POST /messaging/chats/:chatId/messages`
  - отправляет сообщение
  - тело: `{ text, replyTo? }`
  - ответ: `ApiMessage`
- `PATCH /messaging/chats/:chatId/messages/:messageId`
  - редактирует сообщение
  - тело: `{ text }`
  - ответ: `ApiMessage`
- `DELETE /messaging/chats/:chatId/messages/:messageId`
  - удаляет сообщение
  - ответ: `{ ok: true }`
- `PUT /messaging/chats/:chatId/messages/:messageId/reaction`
  - ставит или меняет реакцию
  - тело: `{ emoji }`
  - ответ: `ApiReaction`
- `POST /messaging/saved/messages`
  - сохраняет сообщение в Избранное
  - тело: `{ messageId }`
  - ответ: `ApiMessage`
- `POST /messaging/chats/:chatId/participants`
  - приглашает участников в группу или канал
  - тело: `{ participantIds }`
  - ответ: `ApiChatParticipant[]`
- `POST /messaging/users/:userId/block`
  - блокирует пользователя
  - ответ: `{ ok: true }`
- `POST /messaging/chats/:chatId/spam-report`
  - жалоба на спам для входящего личного чата от не-контакта
  - тело: `{ reason: "spam" }`
  - ответ: `ApiSpamReport`

## Комната ожидания и matchmaking

Файл: `src/features/waiting-room/api/waitingRoomApi.ts`

- `POST /matchmaking/queue`
  - вход в очередь
  - тело: `{ userId }`
  - ответ: `{ inQueue, queueSize? }`
- `POST /matchmaking/queue/leave`
  - выход из очереди
  - тело: `{ userId }`
  - ответ: `{ inQueue, queueSize? }`
- `GET /matchmaking/matches/:matchId`
  - данные найденного кандидата
  - ответ: `ApiMatchCandidate`
- `POST /matchmaking/matches/:matchId/initial-decision`
  - первое подтверждение готовности
  - тело: `{ matchId, accepted }`
  - ответ: `{ ready, token? }`
- `GET /matchmaking/rooms/active-token`
  - активная 15-минутная комната пользователя
  - ответ: `ApiMatchRoomToken | null`
- `GET /matchmaking/rooms/tokens/:tokenId`
  - проверяет, жив ли token комнаты
  - ответ: `ApiMatchRoomToken`
- `POST /matchmaking/rooms/tokens/:tokenId/leave`
  - ручной выход из временной комнаты
  - ответ: `{ ok: true }`
- `GET /matchmaking/rooms/tokens/:tokenId/messages`
  - сообщения временной комнаты
  - ответ: `ApiTemporaryRoomMessage[]`
- `POST /matchmaking/rooms/tokens/:tokenId/messages`
  - отправляет сообщение во временную комнату
  - тело: `{ text, replyTo? }`
  - ответ: `ApiTemporaryRoomMessage`
- `PATCH /matchmaking/rooms/tokens/:tokenId/messages/:messageId`
  - редактирует сообщение временной комнаты
  - тело: `{ text }`
  - ответ: `ApiTemporaryRoomMessage`
- `DELETE /matchmaking/rooms/tokens/:tokenId/messages/:messageId`
  - удаляет сообщение временной комнаты
  - ответ: `{ ok: true }`
- `POST /matchmaking/rooms/tokens/:tokenId/final-consent`
  - финальное согласие после 15 минут
  - тело: `{ accepted }`
  - ответ: `ApiMatchFinalConsent`
- `POST /matchmaking/rooms/permanent-chat`
  - создаёт постоянный чат после взаимного финального согласия
  - тело: `{ tokenId }`
  - ответ: `{ chatId }`
- `POST /matchmaking/rooms/tokens/:tokenId/report`
  - жалоба на временного собеседника
  - тело: `{ reason: "abuse" }`
  - ответ: `{ ok: true }`

## Локальные данные телефона

`pin` и `mute` не идут на backend. Это персональные настройки конкретного устройства.

Файл: `src/features/messaging/repository/chatPreferencesRepository.ts`

Хранится объект `ApiChatPreferences`:

- `chatId`
- `isPinned`
- `isMuted`
- `mutedUntil`

Сейчас используется локальный storage-wrapper проекта. Для нативного приложения этот слой изолирован и может быть заменён на Capacitor Preferences без изменения экранов.
