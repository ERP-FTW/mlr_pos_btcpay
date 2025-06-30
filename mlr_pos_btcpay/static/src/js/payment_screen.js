/** @odoo-module */

import { _t } from "@web/core/l10n/translation";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";  // ✅ Update: Use AlertDialog, not ErrorPopup
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";         // ✅ Needed to access 'dialog'
import { onMounted } from "@odoo/owl";                       // (optional if using `setup()`)

patch(PaymentScreen.prototype, {
    setup() {
        super.setup();
        this.dialog = this.env.services.dialog;  // ✅ Replace popup with dialog
    },

    async validateOrder(isForceValidate) {
        console.log('calling new validate order for odoo 18');

        for (let line of this.paymentLines) {
            console.log("called btcpay validation");

            if (line.is_crypto_payment && line.payment_method_id.use_payment_terminal === 'btcpay') {
                try {
                    let order_id = this.pos.get_order().uid;

                    let api_resp = await this.env.services.orm.silent.call(
                        'pos.payment.method',
                        'btcpay_check_payment_status',
                        [{
                            invoice_id: line.cryptopay_invoice_id,
                            pm_id: line.payment_method_id.id,
                            order_id: order_id
                        }],
                    );

                    console.log(api_resp);
                    console.log(api_resp.status);

                    if (api_resp.status === 'Paid' || api_resp.status === 'Settled') {
                        console.log("valid btcpay transaction");
                        line.crypto_payment_status = 'Invoice Paid';
                        line.set_payment_status('done');
                    }

                    else if (['New', 'Unpaid', 'Processing'].includes(api_resp.status)) {
                        console.log("unpaid btcpay transaction");

                        // 🔁 CHANGE:
                        // - this.popup.add("ErrorPopup", { ... })
                        // → await this.dialog.add(AlertDialog, { ... })
                        await this.dialog.add(AlertDialog, {
                            title: _t("Payment Request Pending"),
                            body: _t("Payment Pending, retry after customer confirms"),
                        });

                        line.set_payment_status('cryptowaiting');
                        return false;  // Prevent continuing
                    }

                    else if (['Expired', 'Invalid'].includes(api_resp.status)) {
                        console.log("expired btcpay transaction");

                        // 🔁 CHANGE:
                        await this.dialog.add(AlertDialog, {
                            title: _t("Payment Request Expired"),
                            body: _t("Payment Request expired, retry to send another send request"),
                        });

                        line.set_payment_status('retry');
                        return false;
                    }

                    else if (api_resp.status) {
                        console.log("unknown btcpay transaction");

                        // 🔁 CHANGE:
                        await this.dialog.add(AlertDialog, {
                            title: _t("Payment Request Unknown"),
                            body: _t("Unknown BTCPay status. Please retry."),
                        });

                        return false;
                    }

                } catch (error) {
                    console.log(error);

                    // 🔁 CHANGE:
                    await this.dialog.add(AlertDialog, {
                        title: _t("BTCPay Error"),
                        body: _t("Could not verify BTCPay payment. Try again."),
                    });

                    return false;
                }
            }
        }

        return super.validateOrder(isForceValidate);
    },
});
