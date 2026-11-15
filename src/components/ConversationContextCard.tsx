import React, { useState } from 'react';
import { Check, FileText, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { ContextDocument } from '../types/meeting';
import { FolderOutlineIcon } from './LoopIcons';

interface ConversationContextCardProps {
  documents: ContextDocument[];
}

export const ConversationContextCard: React.FC<ConversationContextCardProps> = ({
  documents,
}) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDocIds, setActiveDocIds] = useState<string[]>(
    documents.map((d) => d.id)
  );

  const toggleDoc = (id: string) => {
    setActiveDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="bg-white border border-gray-100 rounded-4 p-4 lg:p-5 h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex items-center justify-between mb-3 gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="heading-06 text-gray-700 truncate">
            {t.context.title}
          </h2>
          <span className="label-02 text-gray-500 shrink-0">
            · {t.context.mockLabel}
          </span>
        </div>
        {isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-800 p-1 rounded-2 transition-colors cursor-pointer"
            aria-label={t.context.collapseAria}
          >
            <X className="size-icon-xs" />
          </button>
        )}
      </div>

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex-1 min-h-[76px] rounded-3 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label={t.context.openAria}
        >
          <FolderOutlineIcon className="w-9 h-9 lg:w-10 lg:h-10 text-gray-500" />
        </button>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto loop-scroll pr-1">
          {documents.map((doc) => {
            const isEnabled = activeDocIds.includes(doc.id);
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => toggleDoc(doc.id)}
                className={`w-full text-left rounded-2 border px-3 py-2 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                  isEnabled
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-white border-gray-100 opacity-70'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <FileText className="size-icon-xs text-gray-600 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="body-02 text-gray-800 truncate">
                      {doc.title}
                    </p>
                    <p className="label-01 text-gray-500 line-clamp-1">
                      {doc.summary}
                    </p>
                  </div>
                </div>
                <span
                  className={`size-icon-sm rounded-1 flex items-center justify-center shrink-0 mt-0.5 ${
                    isEnabled
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-transparent'
                  }`}
                >
                  <Check className="size-3" strokeWidth={2.5} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
