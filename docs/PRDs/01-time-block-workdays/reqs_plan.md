# Requirements for Time Block Workdays

- Revise the `@WeeklyCalendar.tsx` component's time block settings and logic.
- Implement functionality to allow showing only a user-selected subset of calendar days (e.g., "working days").
- User should still be able to choose the number of days they want to show -- the count is the total number of visible days after excluding the days they don't want to show.
- Enable users to exclude specific days (like Saturday and Sunday) from the calendar view.
- Ensure all existing calendar logic, particularly the drag-to-move functionality for time blocks, adapts correctly and functions seamlessly when days are hidden.
- Update the calendar settings popover UI.
- Add a set of checkboxes within the settings popover, allowing users to individually mark which days of the week should be displayed.
- Set the default behavior to show all days of the week.
