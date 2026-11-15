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
    <section className="bg-white border border-[#DFDDE9] rounded-[18px] p-4 lg:p-5 h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex items-center justify-between mb-3 gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-[17px] lg:text-[18px] font-medium text-[#5A5770] tracking-[-0.01em] truncate">
            {t.context.title}
          </h2>
          <span className="text-[11px] font-medium text-[#8E8BA3] shrink-0">
            · {t.context.mockLabel}
          </span>
        </div>
        {isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[#8E8BA3] hover:text-[#4C4962] p-1 rounded-lg transition-colors cursor-pointer"
            aria-label={t.context.collapseAria}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex-1 min-h-[76px] rounded-[16px] bg-[#E6E5EC] hover:bg-[#DDDCE6] transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B49EA]"
          aria-label={t.context.openAria}
        >
          <FolderOutlineIcon className="w-9 h-9 lg:w-10 lg:h-10 text-[#8E8BA3]" />
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
                className={`w-full text-left rounded-xl border px-3 py-2 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                  isEnabled
                    ? 'bg-[#F6F5FC] border-[#CFC9F5]'
                    : 'bg-white border-[#EAE8F3] opacity-70'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#7D7994] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#3E3B52] truncate">
                      {doc.title}
                    </p>
                    <p className="text-[11.5px] text-[#8E8BA3] line-clamp-1">
                      {doc.summary}
                    </p>
                  </div>
                </div>
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    isEnabled
                      ? 'bg-[#5B49EA] text-white'
                      : 'bg-[#ECEAF4] text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
