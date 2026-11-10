package de.pasci.f1manager;

/** F1 Saisonfortschritt (4×1): Wie weit die Saison ist. */
public class ProgressWidget extends BaseWidget {
    @Override String kind() { return "progress"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
