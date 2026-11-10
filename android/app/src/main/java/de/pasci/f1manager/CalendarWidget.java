package de.pasci.f1manager;

/** F1 Kalender (5×1): Alle Rennen als Flaggen. */
public class CalendarWidget extends BaseWidget {
    @Override String kind() { return "calendar"; }
    @Override int maxDrivers() { return 1; }
    @Override boolean needTeam() { return false; }
}
