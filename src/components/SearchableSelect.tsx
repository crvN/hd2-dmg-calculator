import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { matchesSearch } from "../logic/shared";

export type SearchableSelectOption = {
  id: string;
  label: string;
};

type SearchableSelectProps = {
  label: string;
  value: string;
  options: readonly SearchableSelectOption[];
  disabled?: boolean;
  onChange: (id: string) => void;
};

export function SearchableSelect({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: SearchableSelectProps) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  // Null until the user types, so the input shows the selection and the list stays unfiltered.
  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedLabel = options.find((o) => o.id === value)?.label ?? "";
  const visibleOptions =
    query === null
      ? options
      : options.filter((option) => matchesSearch(option.label, query));
  const hasVisibleOptions = visibleOptions.length > 0;
  const showList = isOpen && hasVisibleOptions;

  useEffect(() => {
    if (!showList) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [showList, activeIndex, query]);

  // Typing right after a pick or Escape should replace the name, not append to it.
  useEffect(() => {
    if (query === null && document.activeElement === inputRef.current) {
      inputRef.current?.select();
    }
  }, [query, selectedLabel]);

  function open() {
    if (isOpen) return;
    setIsOpen(true);
    setActiveIndex(
      Math.max(
        options.findIndex((o) => o.id === value),
        0,
      ),
    );
  }

  function close() {
    setIsOpen(false);
    setQuery(null);
  }

  function commit(option: SearchableSelectOption) {
    onChange(option.id);
    close();
  }

  function moveActive(step: number) {
    if (!isOpen) {
      open();
    } else if (hasVisibleOptions) {
      const count = visibleOptions.length;
      setActiveIndex((activeIndex + step + count) % count);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      moveActive(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && isOpen) {
      e.preventDefault();
      const option = visibleOptions[activeIndex];
      if (option) commit(option);
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      close();
    }
  }

  function handleClick(e: MouseEvent<HTMLInputElement>) {
    open();
    // The click collapses the selection made on focus.
    if (query === null) e.currentTarget.select();
  }

  return (
    <div className="field">
      <label htmlFor={id}>
        <span>{label}</span>
      </label>
      <div className="combobox">
        <input
          ref={inputRef}
          id={id}
          className="combobox-input"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-activedescendant={
            showList ? `${listId}-${activeIndex}` : undefined
          }
          placeholder="Type to filter…"
          disabled={disabled}
          value={query ?? selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={(e) => {
            open();
            e.currentTarget.select();
          }}
          onClick={handleClick}
          onBlur={close}
          onKeyDown={handleKeyDown}
        />
        {showList && (
          // Keeps focus in the input, which would otherwise blur and close the list before the click lands.
          <ul
            ref={listRef}
            id={listId}
            className="combobox-popup"
            role="listbox"
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
          >
            {visibleOptions.map((option, index) => (
              <li
                key={option.id}
                id={`${listId}-${index}`}
                className={
                  index === activeIndex
                    ? "combobox-option combobox-option-active"
                    : "combobox-option"
                }
                role="option"
                aria-selected={option.id === value}
                onClick={() => commit(option)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
        {isOpen && !hasVisibleOptions && (
          <p className="combobox-popup combobox-empty" role="status">
            {options.length === 0 ? "Nothing to pick yet" : "No matches"}
          </p>
        )}
      </div>
    </div>
  );
}
