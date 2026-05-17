# ⚓ Odoo 19 port — RESUME ANCHOR (account_reconcile_oca / _model_oca)

> **Read this first.** Branch `19.0` of `rosenvladimirov/account-reconcile`.
> Status snapshot 2026-05-18. Target: Терарос **terraros-v19** (164.68.114.107,
> db `odoo-2026`) needs OCA reconcile for InfoPay bank statements.

## TL;DR
- **OWL/JS port of `account_reconcile_oca` = DONE** (commits `f60f8bb`, `974ba81`).
- **BLOCKED** on `account_reconcile_model_oca`: Odoo 19 CE **removed the reconcile
  matching field-set from native `account.reconcile.model`**; the OCA module
  `_inherit`s and uses those fields but never defined them.
- **Next step = re-introduce that accounting field-set + validate the
  820-line matching engine, then deploy + browser-test.**
- ⚠️ **Accounting-correctness sensitive — do NOT improvise field semantics.**
  Derive them by diffing **Odoo 18 native vs Odoo 19 native**
  `account/models/account_reconcile_model.py`.

## The blocker (concrete)
Odoo 19 native `account.reconcile.model` (`/usr/lib/python3/dist-packages/odoo/
addons/account/models/account_reconcile_model.py`, ~189 lines / ~26 fields) no
longer provides these fields that the OCA code references:

- **`rule_type`** — critical `Selection` driving ALL branching
  (`invoice_matching` / `writeoff_button` / `writeoff_suggestion`); used 6+
  places in `account_reconcile_model_oca/models/account_reconcile_model.py`.
- `match_nature`, `match_partner`, `auto_reconcile`, `match_same_currency`,
  `allow_payment_tolerance`, `payment_tolerance_param`,
  `payment_tolerance_type`, `past_months_limit`,
  `match_text_location_label`, `match_text_location_note`,
  `match_text_location_reference`.

Still present in v19 native (do NOT redefine): `line_ids`, `match_amount`,
`match_amount_min`, `match_amount_max`, `match_journal_ids`, `match_label`,
`match_label_param`, `match_partner_ids`.

## Resume procedure
1. Worktree: `~/Проекти/odoo/odoo-19.0/account-reconcile` (branch `19.0`,
   base 18.0 `c347092`). `git pull` first.
2. Get an **Odoo 18 native** `account_reconcile_model.py` reference (an Odoo 18
   source checkout or OCA's 18.0 base) and the **Odoo 19 native** one
   (read from container: `ssh root@164.68.114.107 "docker exec
   terraros-v19-odoo cat /usr/lib/python3/dist-packages/odoo/addons/account/
   models/account_reconcile_model.py"`). Diff → the exact set of removed
   field definitions (types, Selection values, defaults, compute/inverse,
   help). Re-add them verbatim-semantically into
   `account_reconcile_model_oca/models/account_reconcile_model.py`
   (and any matching `account.reconcile.model.line` fields).
3. py_compile + sanity-read the 820-line engine against the re-added schema
   (rule_type branches, payment-tolerance, match_* usage).
4. Deploy to terraros-v19 (mechanism proven this session):
   - Source already on host: `/opt/odoo/odoo-19.0/rv/account-reconcile/`
     (scp updated dirs there again after edits).
   - `docker exec -u 0 terraros-v19-odoo ln -s
     /opt/odoo/rv/account-reconcile/<mod>
     /var/lib/odoo/.local/share/Odoo/addons/19.0/<mod>` for
     `account_reconcile_model_oca` then `account_reconcile_oca`.
   - `docker restart terraros-v19-odoo` (alias-safe, ~3s, www stays 200).
   - odoo shell: `env['ir.module.module'].sudo().update_list()` then
     `...search([('name','=','account_reconcile_oca')]).button_immediate_install()`
     (pulls model_oca as dep). `env.cr.commit()`.
   - Final `docker restart` for clean registry + asset bundle.
   - Deps: `account_statement_base` already installed (OCA 19.0);
     `base_sparse_field` core (provides runtime `fields.Serialized`).
5. Browser-test checklist (only true validation for the OWL widget):
   reconcile **kanban** view (journal → Reconcile); statement **aggregates**
   header/balance; reconcile **form** right panel (data widget,
   debit/credit/amount-in-currency formatting); **selection_badge_uncheck**
   re-click toggles off; **match add-line** populates parent m2o;
   **chatter** renders + empty-safe; **notebook** switches to "manual" tab;
   **rainbowman** on full reconcile. Zero console errors.

## Already done (don't redo)
- `account_reconcile_oca` OWL/JS: many2one `[id,name]`→`{id,display_name}`
  (`.id` / `{id: resId}`), `selection_badge_uncheck` rewritten to Odoo 19
  `BadgeSelectionField`, `reconcile.xml` Chatter `threadId` guarded `.id`.
  `@mail/chatter/web_portal/chatter` still valid in 19; all 21 `@web`
  imports + subclassed view APIs verified vs Odoo 19 source.
- Python: `odoo.fields.first` → `rs[:1]`; `odoo.fields.pg_varchar()`
  → literal `"varchar"`.
- `account_reconcile_model_oca` Python is otherwise Odoo-19-clean (modern
  `from odoo.tools import SQL`, jsonb-safe `partner.name` embedded).
- **`l10n_bg_account_reconcile_patch` is OBSOLETE** — its jsonb
  `_retrieve_partner` fix is already upstream in this fork. Do NOT port it.

## Live state (clean / known-good — nothing half-installed)
`account_reconcile_model_oca` uninstalled; both addons symlinks removed
(modules undiscoverable); native `account.reconcile.model` intact (34 fields);
**InfoPay 37 statements / 85 lines preserved**; www.odoo-shell.dev = 200.
Interim reconciliation = Odoo 19 CE native until this port lands.

Commits: `f60f8bb` (OWL + model_oca bump) → `974ba81` (fields.* WIP).
See also memory `project_oca_reconcile_v19_port_handoff` + task #27.
