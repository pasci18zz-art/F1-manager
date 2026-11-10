package de.pasci.f1manager;

/** F1 Top 3 kompakt (2×2): Die drei Führenden. */
public class Top3CompactWidget extends BaseWidget {
    @Override String kind() { return "top3c"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
