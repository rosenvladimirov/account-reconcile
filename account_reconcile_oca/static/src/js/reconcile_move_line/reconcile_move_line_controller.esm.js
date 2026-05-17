import {ListController} from "@web/views/list/list_controller";

export class ReconcileMoveLineController extends ListController {
    async openRecord(record) {
        var data = {};
        // Odoo 19: a many2one value in record.update() is an object
        // {id, display_name} (was an [id, name] array in <=18). When
        // display_name is omitted, _completeMany2OneValue() resolves it
        // server-side via web_read.
        data[this.props.parentField] = {id: record.resId};
        this.props.parentRecord.update(data);
    }
    async clickAddAll() {
        await this.props.parentRecord.save();
        await this.model.orm.call(
            this.props.parentRecord.resModel,
            "add_multiple_lines",
            [this.props.parentRecord.resIds, this.model.root.domain]
        );
        await this.props.parentRecord.load();
        this.props.parentRecord.model.notify();
    }
}

ReconcileMoveLineController.template = `account_reconcile_oca.ReconcileMoveLineController`;
ReconcileMoveLineController.props = {
    ...ListController.props,
    parentRecord: {type: Object, optional: true},
    parentField: {type: String, optional: true},
};
