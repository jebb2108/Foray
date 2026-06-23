import { useMemo, useState } from 'react';
import {
  INTEREST_GROUPS,
  INTEREST_TOPIC_BY_ID,
  InterestTopic,
} from '../../profile/data/interests';

export interface InterestPath {
  groupId?: string;
  subgroupId?: string;
}

type InterestNavigationItem =
  | { id: string; kind: 'group'; label: string; groupId: string }
  | { id: string; kind: 'subgroup'; label: string; groupId: string; subgroupId: string }
  | { id: string; kind: 'topic'; label: string; topic: InterestTopic };

type InterestCanvasItem =
  | { kind: 'selected'; topic: InterestTopic }
  | { kind: 'navigation'; item: InterestNavigationItem };

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

function withoutEmoji(value: string): string {
  return value
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍\s]+/gu, '')
    .trim();
}

function compactInterestLabel(value: string): string {
  const label = withoutEmoji(value);
  return COMPACT_INTEREST_LABELS[label] ?? label;
}

interface InterestPickerProps {
  selected: string[];
  maxCount: number;
  path: InterestPath;
  onNavigate: (path: InterestPath) => void;
  onToggle: (topicId: string, slot: number) => void;
}

export default function InterestPicker({
  selected,
  maxCount,
  path,
  onNavigate,
  onToggle,
}: InterestPickerProps) {
  // позиции выбранных тем сохраняются для стабильного расположения в сетке
  const [interestSlots, setInterestSlots] = useState<Record<string, number>>({});

  const currentInterestGroup = path.groupId
    ? INTEREST_GROUPS.find((group) => group.id === path.groupId)
    : undefined;
  const currentInterestSubgroup =
    currentInterestGroup && path.subgroupId
      ? currentInterestGroup.subgroups.find((subgroup) => subgroup.id === path.subgroupId)
      : undefined;
  const interestLimitReached = selected.length === maxCount;

  const interestNavigationItems = useMemo<InterestNavigationItem[]>(() => {
    if (interestLimitReached) return [];

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
      .filter((topic) => !selected.includes(topic.id))
      .map((topic) => ({
        id: `topic:${topic.id}`,
        kind: 'topic' as const,
        label: compactInterestLabel(topic.name),
        topic,
      }));
  }, [currentInterestGroup, currentInterestSubgroup, selected, interestLimitReached]);

  const interestCanvas = useMemo<Array<InterestCanvasItem | null>>(() => {
    // выбранные темы занимают прежние позиции
    const selectedTopics = selected
      .map((topicId) => INTEREST_TOPIC_BY_ID.get(topicId))
      .filter((t): t is InterestTopic => Boolean(t));
    const highestSelectedSlot = selectedTopics.reduce(
      (highest, topic) => Math.max(highest, interestSlots[topic.id] ?? 0),
      -1,
    );
    const canvasLength = Math.max(
      selectedTopics.length + interestNavigationItems.length,
      highestSelectedSlot + 1,
    );
    const canvas: Array<InterestCanvasItem | null> = Array.from({ length: canvasLength }, () => null);

    selectedTopics.forEach((topic) => {
      const preferredSlot = interestSlots[topic.id] ?? 0;
      let slot = preferredSlot;
      while (canvas[slot]) slot += 1;
      canvas[slot] = { kind: 'selected', topic };
    });

    // свободные позиции заполняются текущим уровнем навигации
    let navigationIndex = 0;
    for (
      let slot = 0;
      slot < canvas.length && navigationIndex < interestNavigationItems.length;
      slot += 1
    ) {
      if (!canvas[slot]) {
        canvas[slot] = { kind: 'navigation', item: interestNavigationItems[navigationIndex] };
        navigationIndex += 1;
      }
    }
    while (navigationIndex < interestNavigationItems.length) {
      canvas.push({ kind: 'navigation', item: interestNavigationItems[navigationIndex] });
      navigationIndex += 1;
    }

    return canvas;
  }, [selected, interestNavigationItems, interestSlots]);

  const lastNavigationSlot = useMemo(() => {
    // последний элемент растягивается и закрывает пустое место в строке
    if (interestCanvas.filter(Boolean).length % 2 === 0) return -1;
    for (let slot = interestCanvas.length - 1; slot >= 0; slot -= 1) {
      if (interestCanvas[slot]?.kind === 'navigation') return slot;
    }
    return -1;
  }, [interestCanvas]);

  const handleToggle = (topic: InterestTopic, slot: number) => {
    const isSelected = selected.includes(topic.id);
    if (!isSelected && selected.length >= maxCount) return;
    setInterestSlots((current) => {
      const next = { ...current };
      if (isSelected) delete next[topic.id];
      else next[topic.id] = slot;
      return next;
    });
    onToggle(topic.id, slot);
  };

  const handleNavigate = (item: InterestNavigationItem, slot: number) => {
    if (item.kind === 'group') {
      onNavigate({ groupId: item.groupId });
      return;
    }
    if (item.kind === 'subgroup') {
      onNavigate({ groupId: item.groupId, subgroupId: item.subgroupId });
      return;
    }
    if (item.kind === 'topic') {
      handleToggle(item.topic, slot);
    }
  };

  return (
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
                onClick={() => handleToggle(canvasItem.topic, slot)}
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
              onClick={() => handleNavigate(item, slot)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
