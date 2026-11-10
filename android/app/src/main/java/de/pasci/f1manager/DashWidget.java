package de.pasci.f1manager;

/** F1 Übersicht (4×4): Alles auf einen Blick. */
public class DashWidget extends BaseWidget {
    @Override String kind() { return "dash"; }
    @Override int maxDrivers() { return 1; }
    @Override boolean needTeam() { return false; }
}
