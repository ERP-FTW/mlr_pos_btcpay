/** @odoo-module */

import { _t } from "@web/core/l10n/translation";
import { ErrorPopup } from "@web/core/confirmation_dialog/confirmation_dialog";
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { BillScreen } from "@pos_restaurant/app/bill_screen/bill_screen";
import { Dialog } from "@web/core/dialog/dialog";

patch(PaymentScreen.prototype, {
    async validateOrder(isForceValidate) {
        /*const order = this.currentOrder;
        if (!this.pos.config.set_tip_after_payment || order.is_tipped) {
            return super.nextScreen;
        }
        // Take the first payment method as the main payment.
        const mainPayment = order.get_paymentlines()[0];
        if (mainPayment && mainPayment.canBeAdjusted()) {
            return "TipScreen";
        }
        return super.nextScreen;*/
        console.log('calling new validate order for odoo 17')
        for (let line of this.paymentLines) {
            console.log("called btcpay validation");
            if (line.is_crypto_payment && line.payment_method_id.use_payment_terminal == 'btcpay') {
                try {
                    let order_id = this.pos.get_order().uid;
                    let api_resp = await this.env.services.orm.silent.call(
                        'pos.payment.method',
                        'btcpay_check_payment_status',
                        [{ invoice_id: line.cryptopay_invoice_id, pm_id: line.payment_method_id.id, order_id: order_id }],
                    );
                    console.log(api_resp);
                    console.log(api_resp.status);

                    if (api_resp.status == 'Paid' || api_resp.status == 'Settled') {
                        console.log("valid btcpay transaction");
                        line.crypto_payment_status = 'Invoice Paid';
                        line.set_payment_status('done');
                    }
                    else if (api_resp.status == 'New' || api_resp.status == 'Unpaid' || api_resp.status == 'Processing') {
                        console.log("unpaid btcpay transaction");
                            await this.popup.add("ErrorPopup", {
                                title: _t("Payment Request Pending"),
                                body: _t("Payment Pending, retry after customer confirms"),
                                });
                        line.set_payment_status('cryptowaiting');
                    }
                    else if (api_resp.status == 'Expired' || api_resp.status == 'Invalid') {
                        console.log("expired btcpay transaction");
                        this.popup.add(ErrorPopup, {
                            title: _t("Payment Request Expired"),
                            body: _t("Payment Request expired, retry to send another send request"),
                        });
                        line.set_payment_status('retry');
                    }
                    else if (api_resp.status) {
                        console.log("unknown btcpay transaction");
                        this.popup.add(ErrorPopup, {
                            title: _t("Payment Request unknown"),
                            body: _t("Payment Request unknown, retry to send another send request"),
                        });
                    }
                }
                catch (error) {
                    console.log(error);
                    return false;
                }
            }
        }
        return super.validateOrder(isForceValidate);
    },
});
