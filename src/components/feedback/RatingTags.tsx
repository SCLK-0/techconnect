import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export type RatingTag = 
  | 'clear_explanations'
  | 'great_communication'
  | 'always_on_time'
  | 'patient_friendly'
  | 'very_knowledgeable'
  | 'helped_improve'
  | 'well_prepared'
  | 'engaging_session'
  | 'good_examples'
  | 'responsive';

export const RATING_TAG_LABELS: Record<RatingTag, { label: string; emoji: string }> = {
  clear_explanations: { label: "Clear Explanations", emoji: "🎯" },
  great_communication: { label: "Great Communication", emoji: "💬" },
  always_on_time: { label: "Always On Time", emoji: "⏰" },
  patient_friendly: { label: "Patient & Friendly", emoji: "😊" },
  very_knowledgeable: { label: "Very Knowledgeable", emoji: "🧠" },
  helped_improve: { label: "Helped Me Improve", emoji: "🚀" },
  well_prepared: { label: "Well Prepared", emoji: "📚" },
  engaging_session: { label: "Engaging Session", emoji: "✨" },
  good_examples: { label: "Good Examples", emoji: "💡" },
  responsive: { label: "Responsive", emoji: "⚡" },
};

interface RatingTagsProps {
  selectedTags: RatingTag[];
  onTagToggle: (tag: RatingTag) => void;
  readonly?: boolean;
}

export function RatingTags({ selectedTags, onTagToggle, readonly = false }: RatingTagsProps) {
  const tags = Object.keys(RATING_TAG_LABELS) as RatingTag[];

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        const { label, emoji } = RATING_TAG_LABELS[tag];

        return (
          <Badge
            key={tag}
            variant={isSelected ? "default" : "outline"}
            className={`cursor-pointer transition-all ${
              readonly ? "cursor-default" : "hover:scale-105"
            } ${isSelected ? "pr-2" : ""}`}
            onClick={() => !readonly && onTagToggle(tag)}
          >
            <span className="mr-1">{emoji}</span>
            {label}
            {isSelected && <Check className="ml-1 h-3 w-3" />}
          </Badge>
        );
      })}
    </div>
  );
}

interface TutorRatingTagsDisplayProps {
  tags: Array<{ tag: RatingTag; tag_count: number; percentage: number }>;
  limit?: number;
}

export function TutorRatingTagsDisplay({ tags, limit = 5 }: TutorRatingTagsDisplayProps) {
  const topTags = tags.slice(0, limit);

  if (topTags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No rating tags yet</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {topTags.map(({ tag, tag_count, percentage }) => {
        const { label, emoji } = RATING_TAG_LABELS[tag];
        return (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1"
            title={`${tag_count} reviews (${percentage}%)`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
            <span className="text-xs opacity-70">({percentage}%)</span>
          </Badge>
        );
      })}
    </div>
  );
}
