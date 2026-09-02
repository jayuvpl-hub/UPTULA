// Maps a category / subcategory name to a Themify (ti-) icon class.
// Used by the navbar Jobs mega-menu and the homepage "Explore by Category" section.
// Themify icon set is loaded globally via public/assets/plugins/icons/css/icons.css.

const ICON_RULES = [
  [/(data|analyt|scien|machine|\bml\b|\bai\b|statist)/, 'ti-bar-chart'],
  [/(information tech|info tech|\bit\b|software|developer|program|comput|tech|\bweb\b|app dev|devops)/, 'ti-desktop'],
  [/(sales|business develop|\bbd\b|telesales)/, 'ti-shopping-cart'],
  [/(market|seo|digital|brand|advertis|social media|content market)/, 'ti-announcement'],
  [/(financ|account|bank|audit|\btax\b|invest|insur)/, 'ti-wallet'],
  [/(health|medical|hospital|nurse|pharma|doctor|clinic|dental|wellness)/, 'ti-heart'],
  [/(educat|teach|train|tutor|academ|school|professor|faculty)/, 'ti-book'],
  [/(engineer|mechanic|civil|electric|construct|architect|manufactur|product)/, 'ti-ruler-pencil'],
  [/(human resource|\bhr\b|recruit|talent|staffing)/, 'ti-user'],
  [/(design|graphic|\bui\b|\bux\b|\bart\b|creative|anim)/, 'ti-palette'],
  [/(customer|support|\bbpo\b|call cent|help desk|service desk)/, 'ti-headphone-alt'],
  [/(logistic|supply|delivery|driver|transport|warehouse|courier|fleet)/, 'ti-truck'],
  [/(hospitality|hotel|food|restaurant|\bchef\b|tourism|travel|catering|culinary)/, 'ti-cup'],
  [/(retail|\bstore\b|\bshop\b|merchandis)/, 'ti-bag'],
  [/(media|content|writer|journal|video|photo|film|broadcast|editor)/, 'ti-video-camera'],
  [/(secur|guard|defen|police|safety|surveillance)/, 'ti-shield'],
  [/(real estate|property|\brealty\b)/, 'ti-home'],
  [/(automobile|\bauto\b|\bcar\b|vehicle|automotive)/, 'ti-car'],
  [/(telecom|network|communicat)/, 'ti-world'],
  [/(admin|operation|office|manage|secretar|coordinat|executive)/, 'ti-briefcase'],
  [/(legal|\blaw\b|advocate|complianc|paralegal)/, 'ti-panel'],
  [/(research|develop|\br&d\b|innovat|lab)/, 'ti-light-bulb'],
];

export function getCategoryIcon(name) {
  // Normalize slug separators so "information_technology" matches "information tech".
  const n = String(name || '').toLowerCase().replace(/[_-]+/g, ' ');
  for (const [re, icon] of ICON_RULES) {
    if (re.test(n)) return icon;
  }
  return 'ti-briefcase';
}

// Turn a stored category value/slug into a display label, e.g.
// "information_technology" -> "Information Technology".
export function formatCategoryName(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default getCategoryIcon;
