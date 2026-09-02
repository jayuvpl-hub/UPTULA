// Clear admin cache and reset state
// Run this in browser console if needed

console.log('Clearing admin cache...');

// Clear localStorage
localStorage.removeItem('adminToken');
console.log('Admin token cleared from localStorage');

// Clear sessionStorage
sessionStorage.clear();
console.log('Session storage cleared');

// Force reload
console.log('Reloading page...');
window.location.reload();
