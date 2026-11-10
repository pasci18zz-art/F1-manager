package de.pasci.f1manager;

/** F1 Letztes Rennen (4×2): Ergebnis des letzten Rennens. */
public class LastRaceWidget extends BaseWidget {
    @Override String kind() { return "lastrace"; }
    @Override int maxDrivers() { return 1; }
    @Override boolean needTeam() { return false; }
}
