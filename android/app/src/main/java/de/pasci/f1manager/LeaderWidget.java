package de.pasci.f1manager;

/** F1 Führender (2×1): Wer vorne liegt. */
public class LeaderWidget extends BaseWidget {
    @Override String kind() { return "leader"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
