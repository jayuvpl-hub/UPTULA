import React from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { Link } from "react-router-dom";
function PartTime() {

    return (

        <>
            <Header />
            <>
                {/* ======================= Page Title ===================== */}
                <div className="page-title">
                    <div className="container">
                        <div className="page-caption">
                            <h2>Brose Job</h2>
                            <p>
                                <Link to="/" title="Home">
                                    Home
                                </Link>{" "}
                                <i className="ti-angle-double-right" /> Part Time Jobs
                            </p>
                        </div>
                    </div>
                </div>
                {/* ======================= End Page Title ===================== */}

                    {/* ====================== Start Job Detail 2 ================ */}
                <section className="padd-top-80 padd-bot-80">
                    <div className="container">
                        <div className="row">
                            <div className="col-md-3 col-sm-5">
                                <div className="widget-boxed padd-bot-0">
                                    <div className="widget-boxed-body">
                                        <div className="search_widget_job">
                                            <div className="field_w_search">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Search Keywords"
                                                />
                                            </div>
                                            <div className="field_w_search">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="All Locations"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="widget-boxed padd-bot-0">
                                    <div className="widget-boxed-header">
                                        <h4>Offerd Salary</h4>
                                    </div>
                                    <div className="widget-boxed-body">
                                        <div className="side-list no-border">
                                            <ul>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={1} />
                                                        <label htmlFor={1} />
                                                    </span>{" "}
                                                    Under $10,000 <span className="pull-right">102</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={2} />
                                                        <label htmlFor={2} />
                                                    </span>{" "}
                                                    $10,000 - $15,000 <span className="pull-right">78</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={3} />
                                                        <label htmlFor={3} />
                                                    </span>{" "}
                                                    $15,000 - $20,000 <span className="pull-right">12</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={4} />
                                                        <label htmlFor={4} />
                                                    </span>{" "}
                                                    $20,000 - $30,000 <span className="pull-right">85</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={5} />
                                                        <label htmlFor={5} />
                                                    </span>{" "}
                                                    $30,000 - $40,000 <span className="pull-right">307</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="widget-boxed padd-bot-0">
                                    <div className="widget-boxed-header">
                                        <h4>Job Type</h4>
                                    </div>
                                    <div className="widget-boxed-body">
                                        <div className="side-list no-border">
                                            <ul>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="a1" />
                                                        <label htmlFor="a1" />
                                                    </span>{" "}
                                                    Full Time <span className="pull-right">102</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="b1" />
                                                        <label htmlFor="b1" />
                                                    </span>{" "}
                                                    Part Time <span className="pull-right">78</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="c1" />
                                                        <label htmlFor="c1" />
                                                    </span>{" "}
                                                    Internship <span className="pull-right">12</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="d1" />
                                                        <label htmlFor="d1" />
                                                    </span>{" "}
                                                    Freelancer <span className="pull-right">85</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="e1" />
                                                        <label htmlFor="e1" />
                                                    </span>{" "}
                                                    Contract Base <span className="pull-right">307</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="widget-boxed padd-bot-0">
                                    <div className="widget-boxed-header br-0">
                                        <h4>
                                            Designation{" "}
                                            <a href="#designation" data-toggle="collapse">
                                                <i className="pull-right ti-plus" aria-hidden="true" />
                                            </a>
                                        </h4>
                                    </div>
                                    <div className="widget-boxed-body collapse" id="designation">
                                        <div className="side-list no-border">
                                            <ul>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="a" />
                                                        <label htmlFor="a" />
                                                    </span>{" "}
                                                    Web Designer <span className="pull-right">102</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="b" />
                                                        <label htmlFor="b" />
                                                    </span>{" "}
                                                    Php Developer <span className="pull-right">78</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="c" />
                                                        <label htmlFor="c" />
                                                    </span>{" "}
                                                    Project Manager <span className="pull-right">12</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="d" />
                                                        <label htmlFor="d" />
                                                    </span>{" "}
                                                    Human Resource <span className="pull-right">85</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="e" />
                                                        <label htmlFor="e" />
                                                    </span>{" "}
                                                    CMS Developer <span className="pull-right">307</span>
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id="f" />
                                                        <label htmlFor="f" />
                                                    </span>{" "}
                                                    App Developer <span className="pull-right">256</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="widget-boxed padd-bot-0">
                                    <div className="widget-boxed-header br-0">
                                        <h4>
                                            Experience{" "}
                                            <a href="#experience" data-toggle="collapse">
                                                <i className="pull-right ti-plus" aria-hidden="true" />
                                            </a>
                                        </h4>
                                    </div>
                                    <div className="widget-boxed-body collapse" id="experience">
                                        <div className="side-list no-border">
                                            <ul>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={11} />
                                                        <label htmlFor={11} />
                                                    </span>{" "}
                                                    1Year To 2Year
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={21} />
                                                        <label htmlFor={21} />
                                                    </span>{" "}
                                                    2Year To 3Year
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={31} />
                                                        <label htmlFor={31} />
                                                    </span>{" "}
                                                    3Year To 4Year
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={41} />
                                                        <label htmlFor={41} />
                                                    </span>{" "}
                                                    4Year To 5Year
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={51} />
                                                        <label htmlFor={51} />
                                                    </span>{" "}
                                                    5Year To 7Year
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={61} />
                                                        <label htmlFor={61} />
                                                    </span>{" "}
                                                    7Year To 10Year
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="widget-boxed padd-bot-0">
                                    <div className="widget-boxed-header br-0">
                                        <h4>
                                            Qualification{" "}
                                            <a href="#qualification" data-toggle="collapse">
                                                <i className="pull-right ti-plus" aria-hidden="true" />
                                            </a>
                                        </h4>
                                    </div>
                                    <div className="widget-boxed-body collapse" id="qualification">
                                        <div className="side-list no-border">
                                            <ul>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={12} />
                                                        <label htmlFor={12} />
                                                    </span>{" "}
                                                    High School
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={22} />
                                                        <label htmlFor={22} />
                                                    </span>{" "}
                                                    Intermediate
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={32} />
                                                        <label htmlFor={32} />
                                                    </span>{" "}
                                                    Graduation
                                                </li>
                                                <li>
                                                    {" "}
                                                    <span className="custom-checkbox">
                                                        <input type="checkbox" id={42} />
                                                        <label htmlFor={42} />
                                                    </span>{" "}
                                                    Master Degree
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Start Job List */}
                            <div className="col-md-9 col-sm-7">
                                <div className="row mrg-bot-20">
                                    <div className="col-md-4 col-sm-12 col-xs-12 browse_job_tlt">
                                        <h4 className="job_vacancie">98 Jobs &amp; Vacancies</h4>
                                    </div>
                                    <div className="col-md-8 col-sm-12 col-xs-12">
                                        <div className="fl-right short_by_filter_list">
                                            <div className="search-wide short_by_til">
                                                <h5>Short By</h5>
                                            </div>
                                            <div className="search-wide full">
                                                <select className="wide form-control">
                                                    <option value={1}>Most Recent</option>
                                                    <option value={2}>Most Viewed</option>
                                                    <option value={4}>Most Search</option>
                                                </select>
                                            </div>
                                            <div className="search-wide full">
                                                <select className="wide form-control">
                                                    <option>10 Per Page</option>
                                                    <option value={1}>20 Per Page</option>
                                                    <option value={2}>30 Per Page</option>
                                                    <option value={4}>50 Per Page</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                               
                                <div className="clearfix" />
                                <div className="utf_flexbox_area padd-0">
                                    <ul className="pagination">
                                        <li className="page-item">
                                            {" "}
                                            <a className="page-link" href="#" aria-label="Previous">
                                                {" "}
                                                <span aria-hidden="true">«</span>{" "}
                                                <span className="sr-only">Previous</span>{" "}
                                            </a>{" "}
                                        </li>
                                        <li className="page-item active">
                                            <a className="page-link" href="#">
                                                1
                                            </a>
                                        </li>
                                        <li className="page-item">
                                            <a className="page-link" href="#">
                                                2
                                            </a>
                                        </li>
                                        <li className="page-item">
                                            <a className="page-link" href="#">
                                                3
                                            </a>
                                        </li>
                                        <li className="page-item">
                                            {" "}
                                            <a className="page-link" href="#" aria-label="Next">
                                                {" "}
                                                <span aria-hidden="true">»</span>{" "}
                                                <span className="sr-only">Next</span>{" "}
                                            </a>{" "}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        {/* End Row */}
                    </div>
                </section>
                {/* ====================== End Job Detail 2 ================ */}
            </>
            <Footer />

        </>
    );
}

export default PartTime;