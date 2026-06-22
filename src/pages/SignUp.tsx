import { FormEvent, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonText,
} from '@ionic/react';
import {
  arrowBackOutline,
  checkmark,
  compassOutline,
  lockClosedOutline,
} from 'ionicons/icons';
import {
  LocalUserProfile,
  NewLocalUserProfile,
  saveLocalUser,
} from '../data/localUser';
import './SignUp.scss';

const INTERESTS = [
  'Путешествия',
  'Музыка',
  'Кино',
  'Спорт',
  'Искусство',
  'Технологии',
] as const;

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
    description: 'Выберите несколько тем или пропустите этот шаг',
  },
] as const;

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
  onComplete: (user: LocalUserProfile) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<NewLocalUserProfile>({
    name: '',
    username: '',
    birthDate: '',
    city: '',
    bio: '',
    interests: [],
  });
  const [error, setError] = useState('');

  const maxBirthDate = (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().slice(0, 10);
  })();

  const updateField = (field: keyof NewLocalUserProfile, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const toggleInterest = (interest: string) => {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }));
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

    const user = saveLocalUser({
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
                      autoFocus
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
                      autoFocus
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
                    autoFocus
                    maxLength={180}
                    rows={5}
                  />
                  <small className="signup-counter">{form.bio.length} / 180</small>
                </label>
              )}

              {step === 3 && (
                <fieldset className="signup-interests">
                  <legend className="sr-only">Интересы</legend>
                  <div>
                    {INTERESTS.map((interest) => {
                      const selected = form.interests.includes(interest);
                      return (
                        <button
                          type="button"
                          key={interest}
                          className={selected ? 'is-selected' : ''}
                          onClick={() => toggleInterest(interest)}
                          aria-pressed={selected}
                        >
                          {selected && <IonIcon icon={checkmark} />}
                          {interest}
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
              <IonButton className="signup-submit" type="submit" expand="block">
                {step === STEPS.length - 1 ? 'Создать профиль' : 'Продолжить'}
              </IonButton>
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
