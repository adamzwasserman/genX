#!/bin/bash

# Create bd tickets for each demo control in genx-demo.html
# Each ticket is for testing and fixing the control if not working

set -e

echo "Creating bd tickets for genX demo controls..."

# Create parent epic first
EPIC_ID=$(bd create "Test and fix all genX demo controls" -t epic -p 1 -d "Ensure all demo controls on genx-demo.html are working correctly. Each sub-task tests a specific control and fixes it if broken." --json | jq -r '.id')
echo "Created epic: $EPIC_ID"

# fmtX demos
echo "Creating fmtX tickets..."
bd create "fmtX: Test SmartX auto-detection demo" -t task -p 2 -d "Test the SmartX auto-detection formatter demo. Verify it correctly detects and formats various input types (dates, currency, percentages)." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test currency formatting with input types" -t task -p 2 -d "Test currency formatting demo. Verify dropdown changes input type (number/cents/string/int/smart) and formatting updates correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test percentage formatting with input types" -t task -p 2 -d "Test percentage formatting demo. Verify dropdown changes input type and percentage display updates correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test date formatting with input types" -t task -p 2 -d "Test date formatting demo. Verify dropdown changes input type and date display updates correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test relative time formatting" -t task -p 2 -d "Test relative time formatting demo. Verify dates show as relative times (e.g., '2 days ago')." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test file size formatting" -t task -p 2 -d "Test file size formatting demo. Verify bytes are formatted as KB/MB/GB correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test decimal control" -t task -p 2 -d "Test decimal control demo. Verify decimal places can be controlled." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test large numbers formatting" -t task -p 2 -d "Test large numbers demo. Verify large numbers are formatted with separators." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test compact numbers formatting" -t task -p 2 -d "Test compact numbers demo. Verify numbers are compacted (e.g., 1.2K, 3.4M)." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test phone number formatting" -t task -p 2 -d "Test phone number formatting demo. Verify phone numbers are formatted correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test time formatting" -t task -p 2 -d "Test time formatting demo. Verify time values are formatted correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "fmtX: Test duration formatting" -t task -p 2 -d "Test duration formatting demo. Verify durations are formatted as human-readable strings." --deps "parent-child:$EPIC_ID" --json > /dev/null

# accX demos
echo "Creating accX tickets..."
bd create "accX: Test enhanced buttons" -t task -p 2 -d "Test enhanced buttons demo. Verify buttons have proper ARIA attributes and keyboard accessibility." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "accX: Test form accessibility" -t task -p 2 -d "Test form accessibility demo. Verify form inputs have proper labels and ARIA attributes." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "accX: Test skip navigation" -t task -p 2 -d "Test skip navigation demo. Verify skip link works and is keyboard accessible." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "accX: Test ARIA landmarks" -t task -p 2 -d "Test ARIA landmarks demo. Verify proper landmark roles are applied." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "accX: Test live updates" -t task -p 2 -d "Test live updates demo. Verify aria-live regions announce updates to screen readers." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "accX: Test focus indicators" -t task -p 2 -d "Test focus indicators demo. Verify visible focus indicators on interactive elements." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "accX: Test form errors" -t task -p 2 -d "Test form errors demo. Verify error messages are announced and associated with inputs." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "accX: Test accessible tooltips" -t task -p 2 -d "Test accessible tooltips demo. Verify tooltips are keyboard accessible and announced." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "accX: Test modal focus trap" -t task -p 2 -d "Test modal focus trap demo. Verify focus is trapped within modal and Escape closes it." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "accX: Test status updates" -t task -p 2 -d "Test status updates demo. Verify status changes are announced to assistive technology." --deps "parent-child:$EPIC_ID" --json > /dev/null

# bindX demos
echo "Creating bindX tickets..."
bd create "bindX: Test two-way binding" -t task -p 2 -d "Test two-way binding demo. Verify typing in input updates the bound output in real-time." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "bindX: Test number binding" -t task -p 2 -d "Test number binding demo. Verify number input updates bound display correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "bindX: Test checkbox binding" -t task -p 2 -d "Test checkbox binding demo. Verify checkbox state is reflected in bound display." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "bindX: Test select binding" -t task -p 2 -d "Test select binding demo. Verify dropdown selection updates bound display." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "bindX: Test radio binding" -t task -p 2 -d "Test radio binding demo. Verify radio button selection updates bound display." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "bindX: Test computed properties" -t task -p 2 -d "Test computed properties demo. Verify computed values update when dependencies change." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "bindX: Test form binding" -t task -p 2 -d "Test form binding demo. Verify form fields bind to reactive data correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "bindX: Test textarea binding" -t task -p 2 -d "Test textarea binding demo. Verify textarea content updates bound display." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "bindX: Test conditional binding" -t task -p 2 -d "Test conditional binding demo. Verify elements show/hide based on bound conditions." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "bindX: Test live validation" -t task -p 2 -d "Test live validation demo. Verify validation runs and displays errors in real-time." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "bindX: Test form validation and state" -t task -p 2 -d "Test form validation and state management demo. Verify form state (pristine/dirty/valid) updates correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null

# dragX demos
echo "Creating dragX tickets..."
bd create "dragX: Test basic drag and drop" -t task -p 2 -d "Test basic drag and drop demo. Verify element can be dragged and dropped into drop zone." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "dragX: Test multiple draggables" -t task -p 2 -d "Test multiple draggables demo. Verify multiple elements can be dragged independently." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "dragX: Test type-based drops" -t task -p 2 -d "Test type-based drops demo. Verify drop zones only accept matching drag types." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "dragX: Test keyboard dragging" -t task -p 2 -d "Test keyboard dragging demo. Verify elements can be dragged using keyboard (Enter to grab, arrows to move, Enter to drop)." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "dragX: Test custom ghost image" -t task -p 2 -d "Test custom ghost image demo. Verify custom drag preview appears during drag." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "dragX: Test axis constraint" -t task -p 2 -d "Test axis constraint demo. Verify dragging is constrained to specified axis (x or y)." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "dragX: Test clone mode" -t task -p 2 -d "Test clone mode demo. Verify dragging creates a copy instead of moving original." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "dragX: Test revert animation" -t task -p 2 -d "Test revert animation demo. Verify element animates back when dropped outside valid zone." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "dragX: Test grid snapping" -t task -p 2 -d "Test grid snapping demo. Verify dragged element snaps to grid positions." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "dragX: Test drag events" -t task -p 2 -d "Test drag events demo. Verify drag start/over/end events fire and display correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null

# loadX demos
echo "Creating loadX tickets..."
bd create "loadX: Test spinner loader" -t task -p 2 -d "Test spinner loader demo. Verify spinner appears during loading state." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "loadX: Test skeleton screen" -t task -p 2 -d "Test skeleton screen demo. Verify skeleton placeholder appears during loading." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "loadX: Test progress bar" -t task -p 2 -d "Test progress bar demo. Verify progress bar updates during loading." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "loadX: Test fade transition" -t task -p 2 -d "Test fade transition demo. Verify smooth fade transition when content loads." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "loadX: Test auto strategy" -t task -p 2 -d "Test auto strategy demo. Verify automatic loading strategy selection works." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "loadX: Test custom duration" -t task -p 2 -d "Test custom duration demo. Verify loading duration can be customized." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "loadX: Test HTMX loading" -t task -p 2 -d "Test HTMX loading demo. Verify loadX integrates with HTMX requests." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "loadX: Test fetch API loading" -t task -p 2 -d "Test fetch API loading demo. Verify loadX shows during fetch requests." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "loadX: Test form loading" -t task -p 2 -d "Test form loading demo. Verify loading state on form submission." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "loadX: Test multi-state loading" -t task -p 2 -d "Test multi-state loading demo. Verify multiple loading states can be managed." --deps "parent-child:$EPIC_ID" --json > /dev/null

# navX demos
echo "Creating navX tickets..."
bd create "navX: Test breadcrumb navigation" -t task -p 2 -d "Test breadcrumb navigation demo. Verify breadcrumbs display and navigate correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "navX: Test tab navigation" -t task -p 2 -d "Test tab navigation demo. Verify tabs switch content and keyboard navigation works." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "navX: Test dropdown menu" -t task -p 2 -d "Test dropdown menu demo. Verify dropdown opens/closes and keyboard accessible." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "navX: Test scroll spy" -t task -p 2 -d "Test scroll spy demo. Verify nav items highlight based on scroll position." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "navX: Test sticky navigation" -t task -p 2 -d "Test sticky navigation demo. Verify navigation sticks to top on scroll." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "navX: Test mobile menu" -t task -p 2 -d "Test mobile menu demo. Verify hamburger menu works on mobile viewport." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "navX: Test smooth scrolling" -t task -p 2 -d "Test smooth scrolling demo. Verify anchor links scroll smoothly to targets." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "navX: Test pagination" -t task -p 2 -d "Test pagination demo. Verify pagination controls work correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "navX: Test skip navigation" -t task -p 2 -d "Test skip navigation demo. Verify skip links work for accessibility." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "navX: Test history trail" -t task -p 2 -d "Test history trail demo. Verify browser history updates on navigation." --deps "parent-child:$EPIC_ID" --json > /dev/null

# tableX demos
echo "Creating tableX tickets..."
bd create "tableX: Test column sorting" -t task -p 2 -d "Test column sorting demo. Verify clicking headers sorts table data." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "tableX: Test individual sortable headers" -t task -p 2 -d "Test individual sortable headers demo. Verify only marked columns are sortable." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "tableX: Test custom sort values" -t task -p 2 -d "Test custom sort values demo. Verify custom sort values override displayed text for sorting." --deps "parent-child:$EPIC_ID" --json > /dev/null

# Polymorphic notation demos
echo "Creating polymorphic notation tickets..."
bd create "Polymorphic: Test currency formatting notation" -t task -p 2 -d "Test all four notation styles (Verbose, Colon, JSON, CSS Class) for currency formatting produce same result." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "Polymorphic: Test two-way binding notation" -t task -p 2 -d "Test all four notation styles for two-way binding with debounce work identically." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "Polymorphic: Test ARIA label notation" -t task -p 2 -d "Test all four notation styles for ARIA labels apply correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "Polymorphic: Test loading spinner notation" -t task -p 2 -d "Test all four notation styles for loading spinner work identically." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "Polymorphic: Test route navigation notation" -t task -p 2 -d "Test all four notation styles for route navigation work correctly." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "Polymorphic: Test draggable item notation" -t task -p 2 -d "Test all four notation styles for draggable items work identically." --deps "parent-child:$EPIC_ID" --json > /dev/null
bd create "Polymorphic: Test live interactive demo" -t task -p 2 -d "Test the live interactive demo where all four notations work together in real-time." --deps "parent-child:$EPIC_ID" --json > /dev/null

echo ""
echo "✅ Created all demo control tickets under epic $EPIC_ID"
echo ""
echo "View tickets with: bd dep tree $EPIC_ID"
echo "Find ready work with: bd ready"
