/** @odoo-module */
import { register_payment_method } from "@point_of_sale/app/store/pos_store";
import { PaymentBTCPayPayment } from '@mlr_pos_btcpay/js/payment_cryptopayment';

    register_payment_method('btcpay', PaymentBTCPayPayment);

