package de.pasci.f1manager;

/** F1 Team (2×2): Ein Team mit Punkten. */
public class TeamWidget extends BaseWidget {
    @Override String kind() { return "team"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return true; }
}
