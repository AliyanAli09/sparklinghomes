import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi';

const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Search and select...",
  displayKey = "name",
  valueKey = "code",
  className = "",
  error = false,
  required = false,
  name = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option => 
        option[displayKey].toLowerCase().includes(searchTerm.toLowerCase()) ||
        option[valueKey].toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options, displayKey, valueKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get selected option display text
  const selectedOption = options.find(option => option[valueKey] === value);
  const displayText = selectedOption ? selectedOption[displayKey] : '';

  const handleSelect = (option) => {
    onChange({
      target: {
        name: name,
        value: option[valueKey]
      }
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange({
      target: {
        name: name,
        value: ''
      }
    });
    setSearchTerm('');
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Input */}
      <div 
        className={`relative w-full px-3 py-2 border rounded-md cursor-pointer transition-all duration-200 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        } ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''} ${className}`}
        onClick={handleInputClick}
      >
        <div className="flex items-center justify-between">
          <span className={`${displayText ? 'text-gray-900' : 'text-gray-500'}`}>
            {displayText || placeholder}
          </span>
          <div className="flex items-center space-x-1">
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <FiX className="w-3 h-3 text-gray-400" />
              </button>
            )}
            <FiChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option[valueKey]}
                  className={`px-4 py-2 cursor-pointer hover:bg-primary-50 hover:text-primary-700 transition-colors ${
                    value === option[valueKey] ? 'bg-primary-100 text-primary-800 font-medium' : 'text-gray-900'
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex justify-between items-center">
                    <span>{option[displayKey]}</span>
                    <span className="text-xs text-gray-500">{option[valueKey]}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center text-sm">
                No states found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
