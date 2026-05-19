/**
 * Authentication Redirect Script
 * 
 * This script handles redirects based on authentication status:
 * - Redirects unauthenticated users from protected pages to login
 * - Redirects authenticated users from login/register to index
 * 
 * Usage:
 * Include this script at the very beginning of your HTML with:
 * <script src="auth-redirect.js" data-protected="true|false"></script>
 * 
 * Set data-protected="true" for pages that require authentication (index, status, settings)
 * Set data-protected="false" for auth pages (login, register)
 */

(function() {
    // Wait for DOM to be ready enough to execute script
    const executeRedirect = () => {
        try {
            const currentPath = window.location.pathname;
            
            // Skip redirect logic on auth-redirect.html to allow token processing for OIDC SSO
            if (currentPath.includes('auth-redirect.html')) {
                console.log('On auth-redirect.html, skipping redirect logic to allow token processing');
                return;
            }

            // Get current script element
            const currentScript = document.currentScript;
            
            // Check if isProtected attribute is set
            const isProtected = currentScript && currentScript.getAttribute('data-protected') === 'true';
            
            // Check authentication status
            const token = localStorage.getItem('auth_token');
            let isAuthenticated = false;
            
            if (token) {
                try {
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                        // Add padding if missing
                        const pad = base64.length % 4;
                        if (pad) {
                            if (pad === 1) throw new Error('Invalid base64 string');
                            base64 += new Array(5 - pad).join('=');
                        }
                        // Decode base64 to UTF-8 string safely
                        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                        }).join(''));
                        const payload = JSON.parse(jsonPayload);
                        
                        if (payload.exp) {
                            const currentTime = Math.floor(Date.now() / 1000);
                            if (payload.exp > currentTime) {
                                isAuthenticated = true;
                            } else {
                                console.log('Token expired, clearing auth data');
                                localStorage.removeItem('auth_token');
                                localStorage.removeItem('user_info');
                            }
                        } else {
                            isAuthenticated = true;
                        }
                    } else {
                        // Invalid token format
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user_info');
                    }
                } catch (e) {
                    console.error('Error decoding token:', e);
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_info');
                }
            }
            
            console.log('Auth redirect check - Protected page:', isProtected);
            console.log('Auth redirect check - Is authenticated:', isAuthenticated);
            console.log('Auth redirect check - Current path:', currentPath);
            
            // Handle protected pages (index, status, settings)
            if (isProtected && !isAuthenticated) {
                console.log('Access to protected page without authentication, redirecting to login');
                window.location.href = 'login.html';
                return;
            }
            
            // Handle auth pages (login, register)
            if (!isProtected && isAuthenticated) {
                console.log('Already authenticated, redirecting from auth page to index');
                window.location.href = 'index.html';
                return;
            }
            
            console.log('No redirect needed');
        } catch (error) {
            console.error('Error in auth-redirect.js:', error);
        }
    };
    
    // Execute immediately
    executeRedirect();
})();
