package de.pasci.f1manager;

/** F1 Platz (1×1): Platz eines Fahrers. */
public class PlaceWidget extends BaseWidget {
    @Override String kind() { return "place"; }
    @Override int maxDrivers() { return 1; }
    @Override boolean needTeam() { return false; }
}
