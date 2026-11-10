package de.pasci.f1manager;

/** F1 Wertung (4×3): Die Top 8 der Fahrerwertung. */
public class StandingsWidget extends BaseWidget {
    @Override String kind() { return "top8"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
