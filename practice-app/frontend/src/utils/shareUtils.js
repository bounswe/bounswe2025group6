/**
 * Utility function for sharing content using Web Share API with fallback to clipboard
 * @param {Object} shareData - Object containing title, text, and url
 * @param {Function} t - Translation function
 * @returns {Promise<void>}
 */
export const shareContent = async (shareData, t) => {
  const { title, text, url } = shareData;
  
  // Prepare share data object
  const sharePayload = {
    title: title || '',
    text: text || '',
  };
  
  // Only add url if it's explicitly provided (not null)
  if (url !== null && url !== undefined) {
    sharePayload.url = url;
  } else if (url === undefined) {
    // If url is not provided at all, use current location
    sharePayload.url = window.location.href;
  }
  // If url is null, don't add it to sharePayload

  try {
    // Check if Web Share API is supported
    if (navigator.share) {
      // Check if canShare is available and use it, otherwise try to share directly
      if (navigator.canShare) {
        if (navigator.canShare(sharePayload)) {
          await navigator.share(sharePayload);
          return;
        }
      } else {
        // canShare not available, try to share directly
        try {
          await navigator.share(sharePayload);
          return;
        } catch (shareError) {
          // If share fails, fall through to clipboard
          if (shareError.name === 'AbortError') {
            // User cancelled, don't show error
            return;
          }
        }
      }
    }
    
    // Fallback: Copy to clipboard
    const shareText = (url !== null && url !== undefined) ? `${text}\n\n${t('shareLink')}: ${url}` : text;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText);
      alert(t('shareCopied'));
    } else {
      // Last resort: Show text in alert for user to copy manually
      alert(shareText);
    }
  } catch (error) {
    // User cancelled or error occurred
    if (error.name === 'AbortError') {
      // User cancelled sharing, do nothing
      return;
    }
    
    // Try clipboard as fallback
    try {
      const shareText = (url !== null && url !== undefined) ? `${text}\n\n${t('shareLink')}: ${url}` : text;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        alert(t('shareCopied'));
      } else {
        alert(shareText);
      }
    } catch (clipboardError) {
      console.error('Error sharing content:', error);
      alert(t('shareError'));
    }
  }
};

