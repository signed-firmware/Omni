/**
 * Wiki Tabs — Accessible tabbed interface
 * 
 * Usage:
 *   1. Include this script in your page
 *   2. Add [data-wiki-tabs] wrapper to your tab group
 *   3. Add [role="tab"] buttons with [aria-controls] pointing to panel IDs
 *   4. Add [role="tabpanel"] divs with matching IDs
 * 
 * Example:
 *   <div data-wiki-tabs>
 *     <div role="tablist">
 *       <button role="tab" aria-controls="panel-1">Tab 1</button>
 *       <button role="tab" aria-controls="panel-2">Tab 2</button>
 *     </div>
 *     <div id="panel-1" role="tabpanel" aria-hidden="false">Content 1</div>
 *     <div id="panel-2" role="tabpanel" aria-hidden="true" hidden>Content 2</div>
 *   </div>
 * 
 * Features:
 *   - Keyboard navigation (Arrow Left/Right, Home, End)
 *   - Proper ARIA attributes
 *   - Auto-selects first tab on load
 *   - Easy to style and customize
 */

document.addEventListener('DOMContentLoaded', function () {
    const tabGroups = document.querySelectorAll('[data-wiki-tabs]');

    tabGroups.forEach(function (group) {
        const tabs = group.querySelectorAll('[role="tab"]');
        const panels = group.querySelectorAll('[role="tabpanel"]');

        if (tabs.length === 0 || panels.length === 0) {
            console.warn('[wiki-tabs] Missing tabs or panels in:', group);
            return;
        }

        /**
         * Activate a specific tab and hide all others
         */
        function activateTab(selectedTab) {
            // Deselect all tabs
            tabs.forEach(function (tab) {
                tab.setAttribute('aria-selected', 'false');
                tab.tabIndex = -1;
            });

            // Hide all panels
            panels.forEach(function (panel) {
                panel.setAttribute('aria-hidden', 'true');
                panel.hidden = true;
            });

            // Select the clicked tab
            selectedTab.setAttribute('aria-selected', 'true');
            selectedTab.tabIndex = 0;

            // Show the corresponding panel
            const panelId = selectedTab.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.setAttribute('aria-hidden', 'false');
                panel.hidden = false;
            }
        }

        // Set first tab as active on page load
        if (tabs.length > 0) {
            activateTab(tabs[0]);
        }

        // Click handler
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                activateTab(tab);
            });
        });

        // Keyboard navigation
        tabs.forEach(function (tab) {
            tab.addEventListener('keydown', function (e) {
                const currentIndex = Array.from(tabs).indexOf(tab);
                let nextIndex = currentIndex;
                let handled = false;

                if (e.key === 'ArrowRight') {
                    nextIndex = (currentIndex + 1) % tabs.length;
                    handled = true;
                } else if (e.key === 'ArrowLeft') {
                    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                    handled = true;
                } else if (e.key === 'Home') {
                    nextIndex = 0;
                    handled = true;
                } else if (e.key === 'End') {
                    nextIndex = tabs.length - 1;
                    handled = true;
                }

                if (handled) {
                    e.preventDefault();
                    tabs[nextIndex].focus();
                    activateTab(tabs[nextIndex]);
                }
            });
        });
    });
});
