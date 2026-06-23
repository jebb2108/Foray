# Объекты данных Foray

Основные backend-контракты лежат в `src/shared/api/contracts.ts`. Локальные frontend-модели могут быть богаче UI-полями, но должны приводиться к этим объектам при обмене с backend.

## User/Profile

`ApiUserProfile`

- `id`
- `name`
- `username`
- `birthDate`
- `city`
- `bio`
- `interestIds`
- `createdAt`
- `updatedAt`

Frontend-модель: `src/features/profile/model/userProfile.ts`

## Interest

`ApiInterest`

- `id`
- `groupId`
- `subgroupId`
- `name`

Frontend-данные: `src/features/profile/data/interests.ts`

## Chat

`ApiChat`

- `id`
- `type`: `saved | direct | group | channel`
- `title`
- `peerId`
- `participantIds`
- `unreadCount`
- `isOnline`
- `isContact`
- `isIncomingRequest`
- `isBlocked`
- `isSpamReported`
- `createdAt`
- `updatedAt`

Frontend-модель: `src/features/messaging/model/chat.ts`

`isPinned`, `isMuted`, `mutedUntil` не считаются backend-состоянием чата. Они накладываются локально через `ChatPreferences`.

## Message

`ApiMessage`

- `id`
- `chatId`
- `senderId`
- `senderType`
- `text`
- `sentAt`
- `editedAt`
- `deliveryState`
- `replyTo`

Frontend-модель: `src/features/messaging/model/message.ts`

## Reaction

`ApiReaction`

- `chatId`
- `messageId`
- `emoji`

Frontend хранит агрегированный вид реакций в `MessageReaction`: эмодзи, счётчик, выбранность текущим пользователем.

## Group/Channel participant

`ApiChatParticipant`

- `userId`
- `role`
- `joinedAt`

Используется при создании групп, каналов и приглашении участников.

## SpamReport

`ApiSpamReport`

- `id`
- `chatId`
- `reporterId`
- `reportedUserId`
- `reason: "spam"`
- `createdAt`

UI показывает кнопку `Пожаловаться на спам` только в личном входящем диалоге от пользователя не из контактов.

## MatchCandidate

`ApiMatchCandidate`

- `id`
- `name`
- `age`
- `bio`
- `city`
- `color`
- `isOnline`
- `interestIds`

Frontend-модель: `src/features/waiting-room/model/matching.ts`

## MatchRoomToken

`ApiMatchRoomToken`

- `id`
- `roomId`
- `candidateId`
- `expiresAt`
- `active`
- `partnerOnline`

Frontend хранит минимальный fallback-token в `activeRoomTokenRepository`: `id`, `candidateId`, `startedAt`, `expiresAt`, `active`, `partnerOnline`. Данные партнёра не дублируются в localStorage.

## TemporaryRoomMessage

`ApiTemporaryRoomMessage`

Расширяет `ApiMessage` полем `roomId`.

Frontend временно хранит сообщения комнаты в памяти процесса через `temporaryRoomRepository`, а не в localStorage. После подключения backend этот repository должен читать/писать через `waitingRoomApi`.

## MatchFinalConsent

`ApiMatchFinalConsent`

- `roomTokenId`
- `userId`
- `accepted`
- `decidedAt`

Постоянный чат создаётся только если обе стороны подтвердили продолжение после завершения 15 минут.

## ChatPreferences

`ApiChatPreferences`

- `chatId`
- `isPinned`
- `isMuted`
- `mutedUntil`

Это локальные настройки телефона. Они не отправляются на backend и применяются поверх списка чатов при загрузке состояния.
