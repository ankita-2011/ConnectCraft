export const getAvatarUrl = (photoPath) => {
  if (!photoPath) return '';
  if (
    photoPath.startsWith('http://') ||
    photoPath.startsWith('https://') ||
    photoPath.startsWith('data:')
  ) {
    return photoPath;
  }
  return photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
};

export const getInitials = (name = '') => {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  const firstNameInitial = parts[0][0];
  const lastNameInitial = parts[parts.length - 1][0];
  return (firstNameInitial + lastNameInitial).toUpperCase();
};
