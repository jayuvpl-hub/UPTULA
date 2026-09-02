import React, { useEffect, useRef, useState } from 'react';
import {
  fetchJobCategories,
  fetchSubcategoriesByCategoryId,
  findCategory,
} from '../utils/jobCategoriesApi';

function CustomDropdown({
  value,
  onChange,
  options,
  disabled = false,
  selectStyle,
  optionStyle,
  dropdownId,
  isOpen,
  onToggle,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        onToggle(null);
      }
    };

    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('touchstart', closeOnOutside);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('touchstart', closeOnOutside);
    };
  }, [isOpen, onToggle]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || options.find((opt) => opt.disabled)?.label || 'Select';

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative',
        width: '100%',
        minWidth: 0,
        zIndex: isOpen ? 120 : 1,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(isOpen ? null : dropdownId)}
        style={{
          ...selectStyle,
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayLabel}
        </span>
        <span style={{ flexShrink: 0, fontSize: '10px', color: '#64748b' }}>▼</span>
      </button>

      {isOpen ? (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            padding: '6px 0',
            listStyle: 'none',
            background: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14)',
            maxHeight: 'min(240px, 45vh)',
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: 200,
            boxSizing: 'border-box',
          }}
        >
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <li
                key={`${opt.value}-${opt.label}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled ? 'true' : 'false'}
                onClick={() => {
                  if (opt.disabled || disabled) return;
                  onChange(opt.value);
                  onToggle(null);
                }}
                style={{
                  padding: '10px 12px',
                  fontSize: selectStyle?.fontSize || '13.5px',
                  lineHeight: 1.4,
                  color: opt.disabled ? '#94a3b8' : optionStyle?.color || '#0f172a',
                  background: isSelected ? '#f0fdf4' : optionStyle?.background || '#ffffff',
                  cursor: opt.disabled ? 'default' : 'pointer',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Category + dependent subcategory selects for registration forms.
 * value: { categoryId: string|number, subcategoryId: string|number }
 */
function RegistrationCategoryFields({
  value,
  onChange,
  required = true,
  className = 'form-control',
  inline = false,
  customDropdown = false,
  selectStyle,
  optionStyle,
  labelStyle,
  fieldStyle,
  gridGap = '10px',
}) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [catsError, setCatsError] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const isFooter = className === 'footer-modal-form';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCatsError('');
        const list = await fetchJobCategories();
        if (!cancelled) setCategories(list);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setCatsError('Unable to load categories. Please refresh the page.');
        }
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const categoryId = value?.categoryId;
    if (!categoryId) {
      setSubcategories([]);
      return undefined;
    }

    let cancelled = false;
    const selected = findCategory(categories, categoryId);
    if (selected?.subcategories?.length) {
      setSubcategories(selected.subcategories);
    } else {
      setSubcategories([]);
    }
    setLoadingSubs(true);
    (async () => {
      try {
        let list = await fetchSubcategoriesByCategoryId(categoryId);
        if (!list.length && selected?.subcategories?.length) {
          list = selected.subcategories;
        }
        if (!cancelled) setSubcategories(list);
      } catch (err) {
        console.error(err);
        const selected = findCategory(categories, categoryId);
        if (!cancelled) {
          setSubcategories(selected?.subcategories?.length ? selected.subcategories : []);
        }
      } finally {
        if (!cancelled) setLoadingSubs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value?.categoryId, categories]);

  const selectedCategory = findCategory(categories, value?.categoryId);

  const handleCategoryChange = (e) => {
    onChange({ categoryId: e.target.value, subcategoryId: '' });
  };

  const handleSubcategoryChange = (e) => {
    onChange({ ...value, subcategoryId: e.target.value });
  };

  const categoryPlaceholder = loadingCats
    ? 'Loading categories...'
    : catsError
    ? 'Categories unavailable'
    : categories.length === 0
    ? 'No categories found'
    : 'Choose Category *';

  const subcategoryPlaceholder = !selectedCategory
    ? 'Select Category First *'
    : loadingSubs
    ? 'Loading subcategories...'
    : subcategories.length === 0
    ? 'No subcategories available'
    : 'Choose Sub Category *';

  const categoryOptions = [
    { value: '', label: categoryPlaceholder, disabled: true },
    ...categories.map((cat) => ({ value: String(cat.id), label: cat.name })),
  ];

  const subcategoryOptions = [
    { value: '', label: subcategoryPlaceholder, disabled: true },
    ...subcategories.map((sub) => ({ value: String(sub.id), label: sub.name })),
  ];

  const selectCommonProps = inline
    ? { style: selectStyle }
    : { className };

  const categorySelect = customDropdown ? (
    <CustomDropdown
      value={value?.categoryId || ''}
      onChange={(categoryId) => onChange({ categoryId, subcategoryId: '' })}
      options={categoryOptions}
      disabled={loadingCats}
      selectStyle={selectStyle}
      optionStyle={optionStyle}
      dropdownId="category"
      isOpen={openDropdown === 'category'}
      onToggle={setOpenDropdown}
    />
  ) : (
    <select
      {...selectCommonProps}
      value={value?.categoryId || ''}
      onChange={handleCategoryChange}
      required={required}
      aria-required={required ? 'true' : 'false'}
      disabled={loadingCats}
    >
      <option value="" disabled style={optionStyle}>
        {categoryPlaceholder}
      </option>
      {categories.map((cat) => (
        <option key={cat.id} value={String(cat.id)} style={optionStyle}>
          {cat.name}
        </option>
      ))}
    </select>
  );

  const subcategorySelect = customDropdown ? (
    <CustomDropdown
      value={value?.subcategoryId || ''}
      onChange={(subcategoryId) => onChange({ ...value, subcategoryId })}
      options={subcategoryOptions}
      disabled={!selectedCategory || loadingSubs}
      selectStyle={selectStyle}
      optionStyle={optionStyle}
      dropdownId="subcategory"
      isOpen={openDropdown === 'subcategory'}
      onToggle={setOpenDropdown}
    />
  ) : (
    <select
      {...selectCommonProps}
      value={value?.subcategoryId || ''}
      onChange={handleSubcategoryChange}
      required={required && !!selectedCategory}
      aria-required={required ? 'true' : 'false'}
      disabled={!selectedCategory || loadingSubs}
    >
      <option value="" disabled style={optionStyle}>
        {subcategoryPlaceholder}
      </option>
      {subcategories.map((sub) => (
        <option key={sub.id} value={String(sub.id)} style={optionStyle}>
          {sub.name}
        </option>
      ))}
    </select>
  );

  if (isFooter) {
    return (
      <>
        {categorySelect}
        {subcategorySelect}
      </>
    );
  }

  const requiredMark = <span style={{ color: '#dc3545' }}>*</span>;

  const getFieldZIndex = (fieldId) => {
    if (!customDropdown) return 30;
    if (openDropdown === fieldId) return 200;
    if (openDropdown) return 1;
    return 1;
  };

  const renderField = (label, select, fieldId) => {
    if (inline) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflow: 'visible',
            position: 'relative',
            width: '100%',
            minWidth: 0,
            zIndex: getFieldZIndex(fieldId),
            ...fieldStyle,
          }}
        >
          <label style={labelStyle}>
            {label} {requiredMark}
          </label>
          {select}
        </div>
      );
    }

    return (
      <div className="form-group">
        <label>
          {label} {requiredMark}
        </label>
        {select}
      </div>
    );
  };

  if (inline) {
    return (
      <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: gridGap,
            overflow: 'visible',
            position: 'relative',
            width: '100%',
            minWidth: 0,
            zIndex: customDropdown && openDropdown ? 50 : 30,
          }}
        >
          {renderField('Category', categorySelect, 'category')}
          {renderField('Sub Category', subcategorySelect, 'subcategory')}
        </div>
        {catsError ? (
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
            {catsError}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <>
      {renderField('Category', categorySelect, 'category')}
      {renderField('Sub Category', subcategorySelect, 'subcategory')}
    </>
  );
}

export default RegistrationCategoryFields;
