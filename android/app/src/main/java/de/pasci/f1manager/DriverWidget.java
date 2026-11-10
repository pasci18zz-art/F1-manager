package de.pasci.f1manager;

/** F1 Fahrer (2×1): Ein Fahrer mit Punkten. */
public class DriverWidget extends BaseWidget {
    @Override String kind() { return "driver"; }
    @Override int maxDrivers() { return 1; }
    @Override boolean needTeam() { return false; }
}
