import { FormEvent, useMemo, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonText,
} from '@ionic/react';
import {
  arrowBackOutline,
  compassOutline,
  lockClosedOutline,
} from '../../../shared/icons';
import {
  INTEREST_GROUPS,
  INTEREST_TOPIC_BY_ID,
  InterestTopic,
} from '../../profile/data/interests';
import {
  UserProfile,
  UserProfileDraft,
} from '../../profile/model/userProfile';
import { createUserProfile } from '../../profile/repository/userProfileRepository';
import '../styles/SignUp.scss';

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 6;

const STEPS = [
  {
    title: 'Создайте профиль',
    description: 'Укажите имя и уникальный никнейм, по которому вас смогут найти',
  },
  {
    title: 'О вас',
    description: 'Дата рождения нужна для проверки возраста. Город можно не указывать',
  },
  {
    title: 'Расскажите о себе',
    description: 'Пара предложений поможет другим понять, что вам близко',
  },
  {
    title: 'Ваши интересы',
    description: 'Выберите от 3 до 6 тем, которые вам близки',
  },
] as const;

interface InterestPath {
  groupId?: string;
  subgroupId?: string;
}

type InterestNavigationItem =
  | {
      id: string;
      kind: 'group';
      label: string;
      groupId: string;
    }
  | {
      id: string;
      kind: 'subgroup';
      label: string;
      groupId: string;
      subgroupId: string;
    }
  | {
      id: string;
      kind: 'topic';
      label: string;
      topic: InterestTopic;
    };

type InterestCanvasItem =
  | {
      kind: 'selected';
      topic: InterestTopic;
    }
  | {
      kind: 'navigation';
      item: InterestNavigationItem;
    };

function withoutEmoji(value: string): string {
  return value
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/gu, '')
    .trim();
}

const COMPACT_INTEREST_LABELS: Record<string, string> = {
  'Концерты и фестивали': 'События',
  'Фитнес и здоровье': 'Фитнес',
  'Цифровая культура': 'Диджитал',
  'Вселенные и режиссёры': 'Киновселенные',
  'Социальное вокруг игр': 'Игровое сообщество',
  'Настольные и ролевые': 'Настольные игры',
  'Изобразительное искусство': 'Искусство',
  'Мобильные приложения': 'Мобильная разработка',
  'Квантовые вычисления': 'Квантовые технологии',
  'Домашний кинотеатр': 'Домашнее кино',
  'Связанные увлечения': 'Киноувлечения',
  'Анализ сценариев': 'Сценарии',
  'Любительское видео': 'Видеосъёмка',
  'Визуальные новеллы': 'Визуальные игры',
  'Графический дизайн': 'Графдизайн',
  'Работа по дереву': 'Дерево',
  'Тренажёрный зал': 'Тренажёрный зал',
};

function compactInterestLabel(value: string): string {
  const label = withoutEmoji(value);
  return COMPACT_INTEREST_LABELS[label] ?? label;
}

function normalizeBirthDate(value: string): string | null {
  const parts = value.trim().split(/[./-]/).map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    return null;
  }

  const [day, month, year] = parts;
  const date = new Date(year, month - 1, day);
  if (
    year < 1900 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return [
    year.toString().padStart(4, '0'),
    month.toString().padStart(2, '0'),
    day.toString().padStart(2, '0'),
  ].join('-');
}

interface SignUpProps {
  onComplete: (user: UserProfile) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<UserProfileDraft>({
    name: '',
    username: '',
    birthDate: '',
    city: '',
    bio: '',
    interestIds: [],
  });
  const [error, setError] = useState('');
  const [interestPath, setInterestPath] = useState<InterestPath>({});

  // Выбранная тема сохраняет позицию при переходах между уровнями
  const [interestSlots, setInterestSlots] = useState<Record<string, number>>({});

  const maxBirthDate = (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().slice(0, 10);
  })();

  const updateField = (
    field: Exclude<keyof UserProfileDraft, 'interestIds'>,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const toggleInterest = (interest: InterestTopic, slot: number) => {
    const selected = form.interestIds.includes(interest.id);

    if (!selected && form.interestIds.length >= MAX_INTERESTS) {
      return;
    }

    setForm((current) => ({
      ...current,
      interestIds: selected
        ? current.interestIds.filter((item) => item !== interest.id)
        : [...current.interestIds, interest.id],
    }));
    setInterestSlots((current) => {
      const next = { ...current };
      if (selected) {
        delete next[interest.id];
      } else {
        next[interest.id] = slot;
      }
      return next;
    });
    setError('');
  };

  const validateStep = () => {
    if (step === 0 && (!form.name.trim() || !form.username.trim())) {
      setError('Заполните имя и ник.');
      return false;
    }

    if (step === 1) {
      if (!form.birthDate) {
        setError('Введите дату рождения.');
        return false;
      }

      const normalizedBirthDate = normalizeBirthDate(form.birthDate);
      if (!normalizedBirthDate) {
        setError('Введите дату рождения в формате ДД.ММ.ГГГГ.');
        return false;
      }

      if (normalizedBirthDate > maxBirthDate) {
        setError('Для регистрации необходимо быть старше 18 лет.');
        return false;
      }
    }

    if (step === 3 && form.interestIds.length < MIN_INTERESTS) {
      setError(`Выберите минимум ${MIN_INTERESTS} темы.`);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    setError('');
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError('');
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      handleNext();
      return;
    }

    const normalizedBirthDate = normalizeBirthDate(form.birthDate);
    if (!normalizedBirthDate) {
      setStep(1);
      setError('Проверьте дату рождения.');
      return;
    }

    const user = createUserProfile({
      ...form,
      name: form.name.trim(),
      username: form.username.trim().replace(/^@/, ''),
      birthDate: normalizedBirthDate,
      city: form.city.trim(),
      bio: form.bio.trim(),
    });
    onComplete(user);
  };

  const currentStep = STEPS[step];
  const currentInterestGroup = interestPath.groupId
    ? INTEREST_GROUPS.find((group) => group.id === interestPath.groupId)
    : undefined;
  const currentInterestSubgroup = currentInterestGroup && interestPath.subgroupId
    ? currentInterestGroup.subgroups.find((subgroup) => subgroup.id === interestPath.subgroupId)
    : undefined;
  const interestLimitReached = form.interestIds.length === MAX_INTERESTS;

  const interestNavigationItems = useMemo<InterestNavigationItem[]>(() => {
    if (interestLimitReached) {
      return [];
    }

    if (!currentInterestGroup) {
      return INTEREST_GROUPS.map((group) => ({
        id: `group:${group.id}`,
        kind: 'group',
        label: compactInterestLabel(group.name),
        groupId: group.id,
      }));
    }

    if (!currentInterestSubgroup) {
      return currentInterestGroup.subgroups.map((subgroup) => ({
        id: `subgroup:${currentInterestGroup.id}:${subgroup.id}`,
        kind: 'subgroup' as const,
        label: compactInterestLabel(subgroup.name),
        groupId: currentInterestGroup.id,
        subgroupId: subgroup.id,
      }));
    }

    return currentInterestSubgroup.topics
      .filter((interestTopic) => !form.interestIds.includes(interestTopic.id))
      .map((interestTopic) => ({
        id: `topic:${interestTopic.id}`,
        kind: 'topic' as const,
        label: compactInterestLabel(interestTopic.name),
        topic: interestTopic,
      }));
  }, [
    currentInterestGroup,
    currentInterestSubgroup,
    form.interestIds,
    interestLimitReached,
  ]);

  const interestCanvas = useMemo<Array<InterestCanvasItem | null>>(() => {
    // Выбранные темы занимают прежние позиции
    const selectedTopics = form.interestIds
      .map((topicId) => INTEREST_TOPIC_BY_ID.get(topicId))
      .filter((interestTopic): interestTopic is InterestTopic => Boolean(interestTopic));
    const highestSelectedSlot = selectedTopics.reduce(
      (highest, interestTopic) => Math.max(highest, interestSlots[interestTopic.id] ?? 0),
      -1,
    );
    const canvasLength = Math.max(
      selectedTopics.length + interestNavigationItems.length,
      highestSelectedSlot + 1,
    );
    const canvas: Array<InterestCanvasItem | null> = Array.from(
      { length: canvasLength },
      () => null,
    );

    selectedTopics.forEach((interestTopic) => {
      const preferredSlot = interestSlots[interestTopic.id] ?? 0;
      let slot = preferredSlot;
      while (canvas[slot]) {
        slot += 1;
      }
      canvas[slot] = { kind: 'selected', topic: interestTopic };
    });

    // Свободные позиции заполняются текущим уровнем навигации
    let navigationIndex = 0;
    for (let slot = 0; slot < canvas.length && navigationIndex < interestNavigationItems.length; slot += 1) {
      if (!canvas[slot]) {
        canvas[slot] = {
          kind: 'navigation',
          item: interestNavigationItems[navigationIndex],
        };
        navigationIndex += 1;
      }
    }

    while (navigationIndex < interestNavigationItems.length) {
      canvas.push({
        kind: 'navigation',
        item: interestNavigationItems[navigationIndex],
      });
      navigationIndex += 1;
    }

    return canvas;
  }, [form.interestIds, interestNavigationItems, interestSlots]);

  const lastNavigationSlot = useMemo(() => {
    // Последний элемент растягивается и закрывает пустое место в строке
    if (interestCanvas.filter(Boolean).length % 2 === 0) {
      return -1;
    }

    for (let slot = interestCanvas.length - 1; slot >= 0; slot -= 1) {
      if (interestCanvas[slot]?.kind === 'navigation') {
        return slot;
      }
    }

    return -1;
  }, [interestCanvas]);

  const handleInterestNavigation = (item: InterestNavigationItem, slot: number) => {
    setError('');

    if (item.kind === 'group') {
      setInterestPath({ groupId: item.groupId });
      return;
    }

    if (item.kind === 'subgroup') {
      setInterestPath({
        groupId: item.groupId,
        subgroupId: item.subgroupId,
      });
      return;
    }

    if (item.kind === 'topic') {
      toggleInterest(item.topic, slot);
    }
  };

  const handleInterestBack = () => {
    setError('');
    setInterestPath((current) =>
      current.subgroupId ? { groupId: current.groupId } : {},
    );
  };

  const isInsideInterestNavigation = Boolean(
    step === STEPS.length - 1 && interestPath.groupId && !interestLimitReached,
  );
  const canContinue = step !== STEPS.length - 1 || form.interestIds.length >= MIN_INTERESTS;

  return (
    <IonPage className="signup-page">
      <IonContent fullscreen>
        <main className="signup-shell">
          <form className="signup-card" onSubmit={handleSubmit}>
            <div className="signup-card__heading">
              {step > 0 ? (
                <button
                  className="signup-header-back"
                  type="button"
                  onClick={handleBack}
                  aria-label="Вернуться к предыдущему шагу"
                >
                  <IonIcon icon={arrowBackOutline} />
                </button>
              ) : (
                <span className="signup-header-spacer" />
              )}
              <div className="signup-progress" aria-label={`Шаг ${step + 1} из ${STEPS.length}`}>
                {STEPS.map((_, index) => (
                  <span
                    key={index}
                    className={index <= step ? 'is-active' : ''}
                  />
                ))}
              </div>
              <span className="signup-header-spacer" />
            </div>

            <div className="signup-step-copy">
              {step === 0 && (
                <div className="signup-brand-mark" aria-hidden="true">
                  <IonIcon icon={compassOutline} />
                </div>
              )}
              <h1>{currentStep.title}</h1>
              <p>{currentStep.description}</p>
            </div>

            <div className="signup-step-panel" key={step}>
              {step === 0 && (
                <>
                  <label className="signup-field signup-field--compact">
                    <span className="sr-only">Имя</span>
                    <input
                      name="name"
                      value={form.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      placeholder="Как вас зовут?"
                      autoComplete="name"
                      enterKeyHint="next"
                      maxLength={40}
                    />
                  </label>

                  <label className="signup-field signup-field--compact">
                    <span className="sr-only">Ник</span>
                    <div className="signup-username">
                      {form.username && <span aria-hidden="true">@</span>}
                      <input
                        name="username"
                        value={form.username}
                        onChange={(event) => updateField('username', event.target.value)}
                        placeholder="Выберите никнейм"
                        autoCapitalize="none"
                        autoComplete="username"
                        enterKeyHint="next"
                        maxLength={24}
                      />
                    </div>
                  </label>
                </>
              )}

              {step === 1 && (
                <>
                  <label className="signup-field">
                    <span>Дата рождения</span>
                    <input
                      name="birthDate"
                      type="text"
                      inputMode="numeric"
                      value={form.birthDate}
                      placeholder="ДД.ММ.ГГГГ"
                      onChange={(event) => updateField('birthDate', event.target.value)}
                      enterKeyHint="next"
                      maxLength={10}
                    />
                  </label>

                  <label className="signup-field">
                    <span>Город <small>(необязательно)</small></span>
                    <input
                      name="city"
                      value={form.city}
                      onChange={(event) => updateField('city', event.target.value)}
                      placeholder="Например, Москва"
                      autoComplete="address-level2"
                      enterKeyHint="next"
                      maxLength={60}
                    />
                  </label>
                </>
              )}

              {step === 2 && (
                <label className="signup-field">
                  <span>Немного о себе <small>(необязательно)</small></span>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={(event) => updateField('bio', event.target.value)}
                    placeholder="Чем вы увлекаетесь?"
                    enterKeyHint="done"
                    maxLength={180}
                    rows={5}
                  />
                  <small className="signup-counter">{form.bio.length} / 180</small>
                </label>
              )}

              {step === 3 && (
                <fieldset className="signup-interests">
                  <legend className="sr-only">Интересы</legend>
                  <div className="signup-interest-cloud">
                    {interestCanvas.map((canvasItem, slot) => {
                      if (!canvasItem) {
                        return (
                          <span
                            className={`signup-interest-placeholder${interestLimitReached ? ' is-visible' : ''}`}
                            key={`placeholder:${slot}`}
                            aria-hidden="true"
                          />
                        );
                      }

                      if (canvasItem.kind === 'selected') {
                        const label = compactInterestLabel(canvasItem.topic.name);
                        return (
                          <button
                            type="button"
                            key={canvasItem.topic.id}
                            className="signup-interest-chip is-selected"
                            onClick={() => toggleInterest(canvasItem.topic, slot)}
                            aria-pressed="true"
                          >
                            {label}
                          </button>
                        );
                      }

                      const { item } = canvasItem;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={`signup-interest-chip signup-interest-chip--${item.kind}${slot === lastNavigationSlot ? ' signup-interest-chip--row-fill' : ''}`}
                          onClick={() => handleInterestNavigation(item, slot)}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {error && (
                <IonText color="danger">
                  <p className="signup-error" role="alert">{error}</p>
                </IonText>
              )}
            </div>

            <div className="signup-actions">
              {isInsideInterestNavigation ? (
                <IonButton
                  key={`back:${interestPath.groupId}:${interestPath.subgroupId ?? ''}:${form.interestIds.length}`}
                  className="signup-submit signup-submit--back"
                  type="button"
                  expand="block"
                  fill="clear"
                  onClick={handleInterestBack}
                >
                  <IonIcon icon={arrowBackOutline} slot="start" />
                  Назад
                </IonButton>
              ) : (
                <IonButton
                  key={`continue:${form.interestIds.length}:${canContinue}`}
                  className="signup-submit"
                  type="submit"
                  expand="block"
                  disabled={!canContinue}
                >
                  Продолжить
                </IonButton>
              )}
            </div>

            <p className="signup-privacy">
              <IonIcon icon={lockClosedOutline} />
              Данные хранятся только на этом устройстве
            </p>
          </form>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default SignUp;
