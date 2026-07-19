import React, { useState, useRef } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primereact/autocomplete';

interface AutocompleteInputProps {
    table: string;
    column: string;
    value: string;
    onChange: (val: string) => void;
    onSelect?: (val: string) => void;
    placeholder?: string;
    className?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
    table,
    column,
    value,
    onChange,
    onSelect,
    placeholder = 'Buscar...',
    className = 'w-full text-sm',
    inputClassName = 'w-full'
}) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const search = (event: AutoCompleteCompleteEvent) => {
        const query = event.query;

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            if (!query.trim()) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await fetch(`/api/autocomplete?table=${table}&column=${column}&query=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    setSuggestions([]);
                    return;
                }
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    if (data.length === 0) {
                        setSuggestions(['Sin resultados']);
                    } else {
                        setSuggestions(data);
                    }
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error('Error fetching autocomplete:', error);
                setSuggestions([]);
            }
        }, 350);
    };

    const handleSelect = (e: AutoCompleteSelectEvent) => {
        if (e.value === 'Sin resultados') {
            onChange(''); 
            return;
        }
        onChange(e.value);
        if (onSelect) onSelect(e.value);
    };

    const itemTemplate = (item: string) => {
        if (item === 'Sin resultados') {
            return <div className="text-slate-400 italic pointer-events-none p-2">Sin resultados</div>;
        }
        return <div>{item}</div>;
    };

    return (
        <AutoComplete
            value={value}
            suggestions={suggestions}
            completeMethod={search}
            onChange={(e) => onChange(e.value)}
            onSelect={handleSelect}
            placeholder={placeholder}
            className={className}
            inputClassName={inputClassName}
            itemTemplate={itemTemplate}
        />
    );
};
