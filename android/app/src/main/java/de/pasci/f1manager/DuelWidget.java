package de.pasci.f1manager;

/** F1 Teamduell (2×2): Teamkollegen im Duell. */
public class DuelWidget extends BaseWidget {
    @Override String kind() { return "duel"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return true; }
}
