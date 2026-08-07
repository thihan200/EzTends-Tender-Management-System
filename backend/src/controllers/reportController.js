const {
    saveReportRecord,
    getAdminSummary,
    getAuthoritySummary,
    getAdminTenderReport,
    getAuthorityTenderReport,
    getAdminBidReport,
    getAuthorityBidReport,
    getUserActivityReport,
    getReportHistory
} = require('../models/reportModel');

// Save report generation history
const saveReportHistory = async (req, reportType) => {
    await saveReportRecord(
        reportType,
        req.user.user_id
    );
};

// Generate summary report
const summaryReport = async (req, res) => {
    try {
        let summary;

        if (req.user.type === 'ADMIN') {
            summary = await getAdminSummary();
        } else {
            summary = await getAuthoritySummary(req.user.user_id);
        }

        return res.json({
            message: 'Summary report generated successfully',
            summary: summary
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while generating summary report'
        });
    }
};

// Generate tender report
const tenderReport = async (req, res) => {
    try {
        let tenders;

        if (req.user.type === 'ADMIN') {
            tenders = await getAdminTenderReport();
        } else {
            tenders = await getAuthorityTenderReport(req.user.user_id);
        }

        await saveReportHistory(req, 'TENDER_REPORT');

        return res.json({
            message: 'Tender report generated successfully',
            tenders: tenders
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while generating tender report'
        });
    }
};

// Generate bid report
const bidReport = async (req, res) => {
    try {
        let bids;

        if (req.user.type === 'ADMIN') {
            bids = await getAdminBidReport();
        } else {
            bids = await getAuthorityBidReport(req.user.user_id);
        }

        await saveReportHistory(req, 'BID_REPORT');

        return res.json({
            message: 'Bid report generated successfully',
            bids: bids
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while generating bid report'
        });
    }
};

// Generate user activity report - Admin only
const userActivityReport = async (req, res) => {
    try {
        const users = await getUserActivityReport();

        await saveReportHistory(req, 'USER_ACTIVITY_REPORT');

        return res.json({
            message: 'User activity report generated successfully',
            users: users
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while generating user activity report'
        });
    }
};

// View generated report history - Admin only
const reportHistory = async (req, res) => {
    try {
        const reports = await getReportHistory();

        return res.json({
            message: 'Report history loaded successfully',
            reports: reports
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while loading report history'
        });
    }
};

module.exports = {
    summaryReport,
    tenderReport,
    bidReport,
    userActivityReport,
    reportHistory
};