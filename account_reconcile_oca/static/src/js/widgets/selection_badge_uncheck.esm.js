import {
    BadgeSelectionField,
    badgeSelectionField,
} from "@web/views/fields/badge_selection/badge_selection_field";
import {registry} from "@web/core/registry";

export class FieldSelectionBadgeUncheck extends BadgeSelectionField {
    onChange(value) {
        // Odoo 19: BadgeSelectionField no longer exposes props.value /
        // props.update / props.type. The current value is the `value`
        // getter (returns the id for a many2one) and the field type is
        // the `type` instance attribute. Core already unchecks on
        // re-select for the "selection" branch, but not for "many2one"
        // (it only clears when an explicit `false` is passed), so we
        // keep the override to give many2one the same toggle behaviour.
        if (value === this.value) {
            this.props.record.update({[this.props.name]: false});
            return;
        }
        super.onChange(...arguments);
    }
}

export const FieldSelectionBadgeUncheckField = {
    ...badgeSelectionField,
    component: FieldSelectionBadgeUncheck,
    supportedTypes: ["many2one"],
};
registry
    .category("fields")
    .add("selection_badge_uncheck", FieldSelectionBadgeUncheckField);
