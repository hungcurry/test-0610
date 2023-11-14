
let m_cloud_permission =  {
    AdminUser : {
        Dashboard:{ page:'O', payment:'O'},
        Payment:{ page:'O'},
        Station:{ page:'O', addStation:'O'},
        StationDetail:{ page:'O', action:'O', reset:'O', update:'O'},
        StationEdit:{ page:'O', edit:'O', delete:'O'},
        EVSE:{ page:'O', addEVSE:'O', reset:'O', update:'O', action:'O'},
        EVSEDetail:{ page:'O', delete:'O', dataTransfer:'O', chargingProfile:'O', compositeSchedule:'O', setChargingProfile:'O', clearChargingProfile:'O', changeConfiguration:'O', getDiagnostics:'O', changeAvailablility:'O', remoteStartTransaction: 'O'},
        EVSEEdit:{ page:'O', save: 'O'},
        RatePlan: { page:'O', addRatePlan:'O', delete:'O', copy:'O'},
        RatePlanDetail: { page:'O', addRatePlan:'O', save:'O'},
        User: { page:'O', addUser:'O', userDetail:'O'},
        UserDetail: { page:'O', clear:'O', userEdit:'O', cardDetails:'O', deviceDetail:'O', addRFID:'O', deleteRFID:'O', detailRFID:'O', confirmRFID:'O', payment:'O'},
        RfidUser: { page:'O', addUser:'O', userDetail:'O'},
        RfidUserDetail: { page:'O', userEdit:'O', addRFID:'O'},
        Company: { page:'O', addCompany:'O', detail:'O'},
        Administrator: { page:'O', addAdmin:'O', detailAdmin:'O', downloadList:'O'},
        EVSELog: { page:'O',},
        ErrorLog: { page:'O',},
        SoftwareInfo: { page:'O', addSwRelease:'O', addFwRelease:'O', detail:'O', release:'O'},
        Parking: { page:'X',},
        AdminInfo: { page:'O',},
        Program: { page:'O', addProgram:'O', detail:'O',},
        ChargingProfile: { page:'O', addProfile:'O', detail:'O',},
        Permission: {page:'O', save:'O', cancel:'O'},
    },

    DeveloperUser : {
        Dashboard:{ page:'O', payment:'O'},
        Payment:{ page:'O'},
        Station:{ page:'O', addStation:'O'},
        StationDetail:{ page:'O', action:'O', reset:'O', update:'O'},
        StationEdit:{ page:'O', edit:'O', delete:'O'},
        EVSE:{ page:'O', addEVSE:'O', reset:'O', update:'O', action:'O'},
        EVSEDetail:{ page:'O', delete:'O', dataTransfer:'O', chargingProfile:'O',  compositeSchedule:'O', setChargingProfile:'O', clearChargingProfile:'O', changeConfiguration:'O',getDiagnostics:'O', changeAvailablility:'O', remoteStartTransaction: 'O'},
        EVSEEdit:{ page:'O', save: 'O'},
        RatePlan: { page:'O', addRatePlan:'O', delete:'O', copy:'O'},
        RatePlanDetail: { page:'O', addRatePlan:'O', save:'O'},
        User: { page:'O', addUser:'O', userDetail:'O'},
        UserDetail: { page:'O', clear:'O', userEdit:'O', cardDetails:'O', deviceDetail:'O', addRFID:'O', deleteRFID:'O', detailRFID:'O', confirmRFID:'O', payment:'O'},
        RfidUser: { page:'O', addUser:'O', userDetail:'O'},
        RfidUserDetail: { page:'O', userEdit:'O', addRFID:'O'},
        Company: { page:'O', addCompany:'O', detail:'O'},
        Administrator: { page:'O', addAdmin:'O', detailAdmin:'O', downloadList:'O'},
        EVSELog: { page:'O',},
        ErrorLog: { page:'O',},
        SoftwareInfo: { page:'O', addSwRelease:'O', addFwRelease:'O', detail:'O', release:'O'},
        Parking: { page:'X',},
        AdminInfo: { page:'O',},
        Program: { page:'O', addProgram:'O', detail:'O',},
        ChargingProfile: { page:'O', addProfile:'O', detail:'O',},
        Permission: {page:'O', save:'O', cancel:'O'},
    },

    ViewerUser : {
        Dashboard:{ page:'O', payment:'O'},
        Payment:{ page:'O'},
        Station:{ page:'O', addStation:'X'},
        StationDetail:{ page:'O', action:'X', reset:'X', update:'X'},
        StationEdit:{ page:'O', edit:'X', delete:'X', update:'X', action:'X'},
        EVSE:{ page:'O', addEVSE:'X', reset:'X', update:'X', action:'X'},
        EVSEDetail:{ page:'O', delete:'X', dataTransfer:'X', chargingProfile:'O', compositeSchedule:'O', setChargingProfile:'O', clearChargingProfile:'X', changeConfiguration:'X', getDiagnostics:'O', changeAvailablility:'X', remoteStartTransaction: 'X'},
        EVSEEdit:{ page:'O', save: 'X'},
        RatePlan: { page:'O', addRatePlan:'X', delete:'X', copy:'X'},
        RatePlanDetail: { page:'O', addRatePlan:'X', save:'X'},
        User: { page:'O', addUser:'X', userDetail:'O'},
        UserDetail: { page:'O', clear:'X', userEdit:'X', cardDetails:'O', deviceDetail:'O', addRFID:'X', deleteRFID:'X', detailRFID:'O', confirmRFID:'X', payment:'O'},
        RfidUser: { page:'O', addUser:'X', userDetail:'O'},
        RfidUserDetail: { page:'O', userEdit:'X', addRFID:'X'},
        Company: { page:'O', addCompany:'X', detail:'O'},
        Administrator: { page:'O', addAdmin:'X', detailAdmin:'O', downloadList:'X'},
        EVSELog: { page:'O',},
        ErrorLog: { page:'O',},
        SoftwareInfo: { page:'O', addSwRelease:'X', addFwRelease:'X', detail:'O', release:'X'},
        Parking: { page:'X',},
        AdminInfo: { page:'O',},
        Program: { page:'O', addProgram:'X', detail:'O',},
        ChargingProfile: { page:'O', addProfile:'X', detail:'O',},
        Permission: {page:'O', save:'X', cancel:'O'},
    },

    FAEUser : {
        Dashboard:{ page:'X', payment:'X'},
        Payment:{ page:'X'},
        Station:{ page:'O', addStation:'O'},
        StationDetail:{ page:'O', action:'O', reset:'O', update:'O'},
        StationEdit:{ page:'O', edit:'O', delete:'O'},
        EVSE:{ page:'O', addEVSE:'O', reset:'O', update:'O', action:'O'},
        EVSEDetail:{ page:'O', delete:'O', dataTransfer:'O', chargingProfile:'O', compositeSchedule:'O', setChargingProfile:'O', clearChargingProfile:'O', changeConfiguration:'O', getDiagnostics:'O', changeAvailablility:'O', remoteStartTransaction: 'O'},
        EVSEEdit:{ page:'O', save: 'O'},
        RatePlan: { page:'O', addRatePlan:'O', delete:'O', copy:'O'},
        RatePlanDetail: { page:'O', addRatePlan:'O', save:'O'},
        User: { page:'O', addUser:'O', userDetail:'O'},
        UserDetail: { page:'O', clear:'X', userEdit:'X', cardDetails:'X', deviceDetail:'X', addRFID:'X', deleteRFID:'X', detailRFID:'X', confirmRFID:'X', payment:'X'},
        RfidUser: { page:'O', addUser:'X', userDetail:'O'},
        RfidUserDetail: { page:'O', userEdit:'X', addRFID:'X'},
        Company: { page:'X', addCompany:'X', detail:'X'},
        Administrator: { page:'O', addAdmin:'X', detailAdmin:'X', downloadList:'X'},
        EVSELog: { page:'O',},
        ErrorLog: { page:'O',},
        SoftwareInfo: { page:'O', addSwRelease:'X', addFwRelease:'X', detail:'O', release:'X'},
        Parking: { page:'X',},
        AdminInfo: { page:'O',},
        Program: { page:'O', addProgram:'X', detail:'O',},
        ChargingProfile: { page:'O', addProfile:'O', detail:'O',},
        Permission: {page:'X', save:'X', cancel:'X'},
    },

    CustomerServiceUser : {
        Dashboard:{ page:'O', payment:'X'},
        Payment:{ page:'X'},
        Station:{ page:'O', addStation:'X'},
        StationDetail:{ page:'O', action:'O', reset:'O', update:'X'},
        StationEdit:{ page:'O', edit:'X', delete:'X'},
        EVSE:{ page:'O', addEVSE:'X', reset:'O', update:'X', action:'X'},
        EVSEDetail:{ page:'O', delete:'X', dataTransfer:'X', chargingProfile:'X', compositeSchedule:'X', setChargingProfile:'X', clearChargingProfile:'X', changeConfiguration:'X', getDiagnostics:'X', changeAvailablility:'X', remoteStartTransaction: 'X'},
        EVSEEdit:{ page:'O', save: 'X'},
        RatePlan: { page:'O', addRatePlan:'X', delete:'X', copy:'X'},
        RatePlanDetail: { page:'O', addRatePlan:'X', save:'X'},
        User: { page:'O', addUser:'X', userDetail:'O'},
        UserDetail: { page:'O', clear:'X', userEdit:'X', cardDetails:'O', deviceDetail:'O', addRFID:'X', deleteRFID:'X', detailRFID:'X', confirmRFID:'X', payment:'O'},
        RfidUser: { page:'O', addUser:'X', userDetail:'O'},
        RfidUserDetail: { page:'O', userEdit:'X', addRFID:'X'},
        Company: { page:'X', addCompany:'X', detail:'X'},
        Administrator: { page:'O', addAdmin:'X', detailAdmin:'X', downloadList:'O'},
        EVSELog: { page:'O',},
        ErrorLog: { page:'O',},
        SoftwareInfo: { page:'O', addSwRelease:'X', addFwRelease:'X', detail:'O', release:'X'},
        Parking: { page:'X',},
        AdminInfo: { page:'X',},
        Program: { page:'O', addProgram:'X', detail:'O',},
        ChargingProfile: { page:'O', addProfile:'X', detail:'O',},
        Permission: {page:'X', save:'X', cancel:'X'},
    },

    EngineerUser : {
        Dashboard:{ page:'X', payment:'X'},
        Payment:{ page:'X'},
        Station:{ page:'X', addStation:'X'},
        StationDetail:{ page:'X', action:'X', reset:'X', update:'X'},
        StationEdit:{ page:'X', edit:'X', delete:'X'},
        EVSE:{ page:'X', addEVSE:'X', reset:'X', update:'X', action:'X'},
        EVSEDetail:{ page:'X', delete:'X', dataTransfer:'X', chargingProfile:'X', compositeSchedule:'X', setChargingProfile:'X', clearChargingProfile:'X', changeConfiguration:'X', getDiagnostics:'X', changeAvailablility:'X', remoteStartTransaction: 'X'},
        EVSEEdit:{ page:'X', save: 'X'},
        RatePlan: { page:'X', addRatePlan:'X', delete:'X', copy:'X'},
        RatePlanDetail: { page:'X', addRatePlan:'X', save:'X'},
        User: { page:'X', addUser:'X', userDetail:'X'},
        UserDetail: { page:'X', clear:'X', userEdit:'X', cardDetails:'X', deviceDetail:'X', addRFID:'X', deleteRFID:'X', detailRFID:'X', confirmRFID:'X', payment:'X'},
        RfidUser: { page:'X', addUser:'X', userDetail:'X'},
        RfidUserDetail: { page:'X', userEdit:'X', addRFID:'X'},
        Company: { page:'X', addCompany:'X', detail:'X'},
        Administrator: { page:'X', addAdmin:'X', detailAdmin:'X', downloadList:'X'},
        EVSELog: { page:'X',},
        ErrorLog: { page:'X',},
        SoftwareInfo: { page:'X', addSwRelease:'X', addFwRelease:'X', detail:'X', release:'X'},
        Parking: { page:'X',},
        AdminInfo: { page:'X',},
        Program: { page:'X', addProgram:'X', detail:'X',},
        ChargingProfile: { page:'X', addProfile:'X', detail:'X'},
        Permission: {page:'X', save:'X', cancel:'X'},
    },

}

export { m_cloud_permission }