
let m_cloud_permission =  {
  AdminUser : {
    Dashboard:{ page:'O', payment:'O'},
    Payment:{ page:'O'},
    //-------- EvseManagement -----------
    Station:{ page:'O', addStation:'O'},
    StationDetail:{ page:'O', reset:'O', update:'O', map:'O'},
    StationEdit:{ page:'O', save:'O', delete:'O'},
    EVSE:{ page:'O', addEVSE:'O', reset:'O', update:'O'},
    EVSEDetail:{ page:'O', delete:'O', edit:'O', dataTransfer:'O', chargingProfile:'O', configuration:'O', getDiagnostics:'O', changeAvailablility:'O', remoteTransaction: 'O'},
    EVSEEdit:{ page:'O', save: 'O'},
    RatePlan: { page:'O', addRatePlan:'O', delete:'O', copy:'O', edit:'O'},
    RatePlanDetail: { page:'O', addRatePlan:'O', save:'O'},
    ChargingProfile: { page:'O', addProfile:'O', deleteProfile:'O', detail:'O',},
    ChargingProfileDetail: { page:'O', save:'O'},
    //-------- AccountManagement --------
    RfidUser: { page:'O', addUser:'O', userDetail:'O'},
    RfidUserDetail: { page:'O', userEdit:'O', addRFID:'O', deleteRFID:'O', editRFID:'O'},
    //-------- LogMonitor ---------------
    EVSELog: { page:'O',},
    ErrorLog: { page:'O',},
    Parking: { page:'O',},
    //-------- AdvancedSetting ----------
    User: { page:'O', addUser:'O', userDetail:'O'},
    UserDetail: { page:'O', clear:'O', userEdit:'O', cardDetails:'O', deviceDetail:'O', addRFID:'O', editRFID:'O', deleteRFID:'O', payment:'O'},
    Company: { page:'O', addCompany:'O', detail:'O'},
    Administrator: { page:'O', addAdmin:'O', detailAdmin:'O', downloadList:'O'},
    SoftwareInfo: { page:'O', addSwRelease:'O', addFwRelease:'O', release:'O', detail:'O'},
    Program: { page:'O', addProgram:'O', detail:'O',},
    Permission: { page:'O', save:'O', cancel:'O'},
    TokenManagement: { page:'O', addToken:'O', detail:'O'},
    //-------- Other --------------------
    AdminInfo: { page:'O', addAdmin:'O'},
  },

  DeveloperUser : {
    Dashboard:{ page:'O', payment:'O'},
    Payment:{ page:'O'},
    //-------- EvseManagement -----------
    Station:{ page:'O', addStation:'O'},
    StationDetail:{ page:'O', reset:'O', update:'O', map:'O'},
    StationEdit:{ page:'O', save:'O', delete:'O'},
    EVSE:{ page:'O', addEVSE:'O', reset:'O', update:'O'},
    EVSEDetail:{ page:'O', delete:'O', edit:'O', dataTransfer:'O', chargingProfile:'O', configuration:'O', getDiagnostics:'O', changeAvailablility:'O', remoteTransaction: 'O'},
    EVSEEdit:{ page:'O', save: 'O'},
    RatePlan: { page:'O', addRatePlan:'O', delete:'O', copy:'O', edit:'O'},
    RatePlanDetail: { page:'O', addRatePlan:'O', save:'O'},
    ChargingProfile: { page:'O', addProfile:'O', deleteProfile:'O', detail:'O',},
    ChargingProfileDetail: { page:'O', save:'O'},
    //-------- AccountManagement --------
    RfidUser: { page:'O', addUser:'O', userDetail:'O'},
    RfidUserDetail: { page:'O', userEdit:'O', addRFID:'O', deleteRFID:'O', editRFID:'O'},
    //-------- LogMonitor ---------------
    EVSELog: { page:'O',},
    ErrorLog: { page:'O',},
    Parking: { page:'O',},
    //-------- AdvancedSetting ----------
    User: { page:'O', addUser:'O', userDetail:'O'},
    UserDetail: { page:'O', clear:'O', userEdit:'O', cardDetails:'O', deviceDetail:'O', addRFID:'O', editRFID:'O', deleteRFID:'O', payment:'O'},
    Company: { page:'O', addCompany:'O', detail:'O'},
    Administrator: { page:'O', addAdmin:'O', detailAdmin:'O', downloadList:'O'},
    SoftwareInfo: { page:'O', addSwRelease:'O', addFwRelease:'O', release:'O', detail:'O'},
    Program: { page:'O', addProgram:'O', detail:'O',},
    Permission: { page:'O', save:'O', cancel:'O'},
    TokenManagement: { page:'O', addToken:'O', detail:'O'},
    //-------- Other --------------------
    AdminInfo: { page:'O', addAdmin:'O'},
  },

  FAEUser : {
    Dashboard:{ page:'X', payment:'X'},
    Payment:{ page:'X'},
    //-------- EvseManagement -----------
    Station:{ page:'O', addStation:'O'},
    StationDetail:{ page:'O', reset:'O', update:'O', map:'X'},
    StationEdit:{ page:'O', save:'O', delete:'O'},
    EVSE:{ page:'O', addEVSE:'O', reset:'O', update:'O'},
    EVSEDetail:{ page:'O', delete:'X', edit:'O', dataTransfer:'O', chargingProfile:'O', configuration:'O', getDiagnostics:'O', changeAvailablility:'O', remoteTransaction: 'O'},
    EVSEEdit:{ page:'O', save: 'O'},
    RatePlan: { page:'O', addRatePlan:'O', delete:'O', copy:'O', edit:'O'},
    RatePlanDetail: { page:'O', addRatePlan:'O', save:'O'},
    ChargingProfile: { page:'X', addProfile:'X', deleteProfile:'X', detail:'X',},
    ChargingProfileDetail: { page:'X', save:'X'},
    //-------- AccountManagement --------
    RfidUser: { page:'X', addUser:'X', userDetail:'X'},
    RfidUserDetail: { page:'X', userEdit:'X', addRFID:'X', deleteRFID:'X', editRFID:'X'},
    //-------- LogMonitor ---------------
    EVSELog: { page:'O',},
    ErrorLog: { page:'O',},
    Parking: { page:'O',},
    //-------- AdvancedSetting ----------
    User: { page:'O', addUser:'X', userDetail:'O'},
    UserDetail: { page:'O', clear:'X', userEdit:'X', cardDetails:'X', deviceDetail:'X', addRFID:'X', editRFID:'X', deleteRFID:'X', payment:'X'},
    Company: { page:'X', addCompany:'X', detail:'X'},
    Administrator: { page:'X', addAdmin:'X', detailAdmin:'X', downloadList:'X'},
    SoftwareInfo: { page:'O', addSwRelease:'X', addFwRelease:'X', release:'X', detail:'X'},
    Program: { page:'X', addProgram:'X', detail:'X',},
    Permission: { page:'X', save:'X', cancel:'X'},
    TokenManagement: { page:'X', addToken:'X', detail:'X'},
    //-------- Other --------------------
    AdminInfo: { page:'X', addAdmin:'X',},
  },

  ViewerUser : {
    Dashboard:{ page:'O', payment:'O'},
    Payment:{ page:'O'},
    //-------- EvseManagement -----------
    Station:{ page:'O', addStation:'X'},
    StationDetail:{ page:'O', reset:'X', update:'X', map:'X'},
    StationEdit:{ page:'O', save:'X', delete:'X'},
    EVSE:{ page:'O', addEVSE:'X', reset:'X', update:'X'},
    EVSEDetail:{ page:'O', delete:'X', edit:'O', dataTransfer:'X', chargingProfile:'O', configuration:'O', getDiagnostics:'O', changeAvailablility:'O', remoteTransaction: 'X'},
    EVSEEdit:{ page:'O', save: 'X'},
    RatePlan: { page:'O', addRatePlan:'X', delete:'X', copy:'X', edit:'O'},
    RatePlanDetail: { page:'O', addRatePlan:'X', save:'X'},
    ChargingProfile: { page:'O', addProfile:'X', deleteProfile:'X', detail:'X',},
    ChargingProfileDetail: { page:'X', save:'X'},
    //-------- AccountManagement --------
    RfidUser: { page:'X', addUser:'X', userDetail:'X'},
    RfidUserDetail: { page:'X', userEdit:'X', addRFID:'X', deleteRFID:'X', editRFID:'X'},
    //-------- LogMonitor ---------------
    EVSELog: { page:'O',},
    ErrorLog: { page:'O',},
    Parking: { page:'O',},
    //-------- AdvancedSetting ----------
    User: { page:'O', addUser:'X', userDetail:'O'},
    UserDetail: { page:'O', clear:'X', userEdit:'X', cardDetails:'O', deviceDetail:'O', addRFID:'X', editRFID:'X', deleteRFID:'X', payment:'O'},
    Company: { page:'O', addCompany:'X', detail:'X'},
    Administrator: { page:'O', addAdmin:'X', detailAdmin:'X', downloadList:'X'},
    SoftwareInfo: { page:'O', addSwRelease:'X', addFwRelease:'X', release:'X', detail:'X'},
    Program: { page:'O', addProgram:'X', detail:'X',},
    Permission: { page:'X', save:'X', cancel:'X'},
    TokenManagement: { page:'O', addToken:'X', detail:'X'},
    //-------- Other --------------------
    AdminInfo: { page:'O', addAdmin:'X',},
  },

  CustomerServiceUser : {
    Dashboard:{ page:'X', payment:'X'},
    Payment:{ page:'O'},
    //-------- EvseManagement -----------
    Station:{ page:'O', addStation:'X'},
    StationDetail:{ page:'O', reset:'O', update:'X', map:'X'},
    StationEdit:{ page:'O', save:'X', delete:'X'},
    EVSE:{ page:'O', addEVSE:'X', reset:'O', update:'X'},
    EVSEDetail:{ page:'O', delete:'X', edit:'O', dataTransfer:'X', chargingProfile:'O', configuration:'O', getDiagnostics:'O', changeAvailablility:'O', remoteTransaction: 'O'},
    EVSEEdit:{ page:'O', save: 'X'},
    RatePlan: { page:'O', addRatePlan:'X', delete:'X', copy:'X', edit:'O'},
    RatePlanDetail: { page:'O', addRatePlan:'X', save:'X'},
    ChargingProfile: { page:'X', addProfile:'X', deleteProfile:'X', detail:'X',},
    ChargingProfileDetail: { page:'X', save:'X'},
    //-------- AccountManagement --------
    RfidUser: { page:'X', addUser:'X', userDetail:'X'},
    RfidUserDetail: { page:'X', userEdit:'X', addRFID:'X', deleteRFID:'X', editRFID:'X'},
    //-------- LogMonitor ---------------
    EVSELog: { page:'O',},
    ErrorLog: { page:'O',},
    Parking: { page:'O',},
    //-------- AdvancedSetting ----------
    User: { page:'O', addUser:'X', userDetail:'O'},
    UserDetail: { page:'O', clear:'X', userEdit:'X', cardDetails:'O', deviceDetail:'O', addRFID:'X', editRFID:'X', deleteRFID:'X', payment:'O'},
    Company: { page:'O', addCompany:'X', detail:'X'},
    Administrator: { page:'O', addAdmin:'X', detailAdmin:'X', downloadList:'X'},
    SoftwareInfo: { page:'O', addSwRelease:'X', addFwRelease:'X', release:'X', detail:'X'},
    Program: { page:'O', addProgram:'X', detail:'X',},
    Permission: {page:'X', save:'X', cancel:'X'},
    TokenManagement: { page:'X', addToken:'X', detail:'X'},
    //-------- Other --------------------
    AdminInfo: { page:'X', addAdmin:'X',},
  },

  EngineerUser : {
    Dashboard:{ page:'X', payment:'X'},
    Payment:{ page:'X'},
    //-------- EvseManagement -----------
    Station:{ page:'X', addStation:'X'},
    StationDetail:{ page:'X', reset:'X', update:'X', map:'X'},
    StationEdit:{ page:'X', save:'X', delete:'X'},
    EVSE:{ page:'X', addEVSE:'X', reset:'X', update:'X'},
    EVSEDetail:{ page:'X', delete:'X', edit:'X', dataTransfer:'X', chargingProfile:'X', configuration:'X', getDiagnostics:'X', changeAvailablility:'X', remoteTransaction: 'X'},
    EVSEEdit:{ page:'X', save: 'X'},
    RatePlan: { page:'X', addRatePlan:'X', delete:'X', copy:'X', edit:'X'},
    RatePlanDetail: { page:'X', addRatePlan:'X', save:'X'},
    ChargingProfile: { page:'X', addProfile:'X', deleteProfile:'X', detail:'X'},
    ChargingProfileDetail: { page:'X', save:'X'},
    //-------- AccountManagement --------
    RfidUser: { page:'X', addUser:'X', userDetail:'X'},
    RfidUserDetail: { page:'X', userEdit:'X', addRFID:'X', deleteRFID:'X', editRFID:'X'},
    //-------- LogMonitor ---------------
    EVSELog: { page:'X',},
    ErrorLog: { page:'X',},
    Parking: { page:'X',},
    //-------- AdvancedSetting ----------
    User: { page:'X', addUser:'X', userDetail:'X'},
    UserDetail: { page:'X', clear:'X', userEdit:'X', cardDetails:'X', deviceDetail:'X', addRFID:'X', editRFID:'X', deleteRFID:'X', payment:'X'},
    Company: { page:'X', addCompany:'X', detail:'X'},
    Administrator: { page:'X', addAdmin:'X', detailAdmin:'X', downloadList:'X'},
    SoftwareInfo: { page:'X', addSwRelease:'X', addFwRelease:'X', release:'X', detail:'X'},
    Program: { page:'X', addProgram:'X', detail:'X',},
    Permission: { page:'X', save:'X', cancel:'X'},
    TokenManagement: { page:'X', addToken:'X', detail:'X'},
    //-------- Other --------------------
    AdminInfo: { page:'X', addAdmin:'X',},
  },
}

const mapKeysGroup ={
  Dashboard: ['Dashboard'],
  Payment: ['Payment'],
  EvseManagement: ['Station','StationDetail', 'StationEdit', 'EVSE', 'EVSEDetail', 'EVSEEdit', 'RatePlan', 'RatePlanDetail', 'ChargingProfile' ,'ChargingProfileDetail'],
  //---------------------
  AccountManagement: ['RfidUser','RfidUserDetail'],
  LogMonitor: ['EVSELog', 'ErrorLog','Parking'],
  AdvancedSetting: ['User','UserDetail','Company', 'Administrator', 'SoftwareInfo','Program', 'Permission','TokenManagement'],
  Other: ['AdminInfo'],
}

export { m_cloud_permission , mapKeysGroup }
